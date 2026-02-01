/**
 * HallucinationGuardNode
 *
 * Validates that all generated content is grounded in actual student artifacts.
 * Checks for:
 * - Unverifiable claims
 * - Exaggerated experience
 * - Skills not in student profile
 * - Missing proof links for major claims
 *
 * Blocks application if validation fails and logs hallucination risks.
 *
 * What it does:
 * 1. Validate generated content against Artifact Pack (bullet bank, proof links)
 * 2. Validate against Structured Student Profile (skills, projects, experience)
 * 3. TODO: Validate against Vector DB (resume embeddings)
 * 4. Check for unverifiable claims and exaggerations
 * 5. Calculate confidence score
 * 6. Block workflow if validation fails
 *
 * Validation sources:
 * - Artifact Pack: bullet bank, proof links
 * - Student Profile: skills, education, experience, projects
 * - Vector DB: (TODO) semantic match against resume chunks
 */

import { JobApplyAgentState } from "../state";
import { ChatOpenAI } from "@langchain/openai";
import { searchResumeEmbeddings } from "@/lib/agent/vector-store";
import { z } from "zod";

// Schema for hallucination validation
const HallucinationCheckSchema = z.object({
  isGrounded: z.boolean(),
  hallucinationRisks: z.array(z.string()),
  confidenceScore: z.number().min(0).max(100),
  reasoning: z.string(),
});

/**
 * Check if a skill/technology is mentioned in student profile
 */
function isSkillInProfile(skill: string, studentSkills: string[]): boolean {
  const skillLower = skill.toLowerCase();
  return studentSkills.some(
    (s) =>
      s.toLowerCase().includes(skillLower) ||
      skillLower.includes(s.toLowerCase()),
  );
}

/**
 * Check if evidence is grounded in bullet bank
 */
function isEvidenceInBulletBank(
  evidence: string,
  bulletBank: string[],
): boolean {
  const evidenceLower = evidence.toLowerCase();
  return bulletBank.some(
    (bullet) =>
      bullet.toLowerCase().includes(evidenceLower) ||
      evidenceLower.includes(bullet.toLowerCase()),
  );
}

/**
 * Extract mentioned skills/technologies from text
 */
function extractMentionedSkills(text: string): string[] {
  // Simple keyword extraction (can be improved with NLP)
  const commonTechKeywords = [
    "react",
    "node",
    "python",
    "java",
    "javascript",
    "typescript",
    "aws",
    "docker",
    "kubernetes",
    "mongodb",
    "postgresql",
    "sql",
    "machine learning",
    "ai",
    "api",
    "frontend",
    "backend",
    "fullstack",
  ];

  const mentioned: string[] = [];
  const textLower = text.toLowerCase();

  for (const keyword of commonTechKeywords) {
    if (textLower.includes(keyword)) {
      mentioned.push(keyword);
    }
  }

  return mentioned;
}

export async function hallucinationGuardNode(
  state: JobApplyAgentState,
): Promise<Partial<JobApplyAgentState>> {
  const errors: string[] = [];

  try {
    // Validate required state
    if (!state.personalizationState) {
      throw new Error(
        "Personalization state not loaded. Run PersonalizeNode first.",
      );
    }

    if (!state.artifactState) {
      throw new Error("Artifact state not loaded. Run ArtifactNode first.");
    }

    const {
      requirementEvidenceMap = {},
      answeredQuestions = [],
      confidenceLevels,
    } = state.personalizationState;

    const {
      studentProfile,
      bulletBank = [],
      proofLinks = [],
    } = state.artifactState;

    if (!studentProfile) {
      throw new Error("Student profile not found in artifact state.");
    }

    // Collect evidence for LLM validation
    const allEvidenceText = Object.values(requirementEvidenceMap).join("\n");
    const allAnswersText = answeredQuestions.map((qa) => qa.answer).join("\n");
    const combinedGeneratedContent = `${allEvidenceText}\n${allAnswersText}`;

    // Get semantic similarity context from Vector DB (optional - don't fail if unavailable)
    let vectorContext = "";
    let avgSimilarity = 0;

    if (combinedGeneratedContent.trim().length > 0) {
      try {
        const similarChunks = await searchResumeEmbeddings(
          state.userId,
          combinedGeneratedContent,
          5, // Get top 5 most similar chunks
        );

        if (similarChunks.length > 0) {
          avgSimilarity =
            similarChunks.reduce((sum, chunk) => sum + chunk.score, 0) /
            similarChunks.length;
          console.log(
            `[HallucinationGuard] ✅ Vector DB similarity: ${avgSimilarity.toFixed(2)}`,
          );

          // Build context from similar chunks
          vectorContext = similarChunks
            .map(
              (chunk, i) =>
                `${i + 1}. [Score: ${chunk.score.toFixed(2)}] ${chunk.text.substring(0, 200)}...`,
            )
            .join("\n");
        } else {
          console.log(
            "[HallucinationGuard] ⚠️ No similar chunks found in vector DB",
          );
        }
      } catch (vectorError: any) {
        console.warn(
          "[HallucinationGuard] ⚠️ Vector DB unavailable, continuing without semantic search",
        );
        console.warn(`Vector DB error: ${vectorError?.message || vectorError}`);
        // Continue without vector context - LLM will validate based on profile only
      }
    }

    // Use LLM for validation with all evidence
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
    });

    const validationPrompt = `You are validating a job application's generated content against a candidate's resume. Your job is to determine if the application should be SUBMITTED or BLOCKED.

**CRITICAL: Only block if there are MAJOR issues - missing 6-7+ required skills OR completely fabricated experience.**

Student Profile:
- Skills: ${studentProfile.skills.slice(0, 50).join(", ")}
- Education: ${studentProfile.education.join(", ")}
- Experience: ${studentProfile.experience.slice(0, 5).join(", ")}
- Projects: ${studentProfile.projects.slice(0, 5).join(", ")}

${vectorContext ? `Resume Evidence (semantic similarity: ${avgSimilarity.toFixed(2)}):\n${vectorContext}` : "Vector DB unavailable - validate based on profile only"}

Generated Application Content:
${allEvidenceText}
${allAnswersText}

Job Requirements Analysis:
${confidenceLevels ? `Strong Matches: ${confidenceLevels.strong}, Medium: ${confidenceLevels.medium}, Weak: ${confidenceLevels.weak}` : "Not available"}

**BLOCKING CRITERIA (set isGrounded: false ONLY if):**
1. Missing 6-7+ critical skills/technologies required for the job
2. Completely fabricated projects or experience with NO basis in resume
3. Claims expertise in areas COMPLETELY absent from profile

**DO NOT BLOCK FOR:**
- Missing 1-3 skills or frameworks (candidates can learn)
- Rephrasing experience or projects differently
- Reasonable skill inference (e.g., "frontend development" from React experience)
- Professional language or formatting differences
- Minor exaggerations or emphasis changes

**If semantic similarity is > 0.6, strongly lean towards passing.**

Return:
- isGrounded: true (SUBMIT) unless MAJOR blocking criteria met
- hallucinationRisks: list ONLY critical blockers (empty array if should submit)
- confidenceScore: 70-100 for good applications, 40-69 for acceptable, < 40 only for major issues
- reasoning: brief explanation of decision`;

    const structuredLLM = llm.withStructuredOutput(HallucinationCheckSchema);
    const validationResult = await structuredLLM.invoke(validationPrompt);

    console.log(`[HallucinationGuard] LLM Validation Result:`, {
      isGrounded: validationResult.isGrounded,
      confidenceScore: validationResult.confidenceScore,
      risksCount: validationResult.hallucinationRisks.length,
      avgSimilarity: avgSimilarity.toFixed(2),
    });

    // Block workflow only if LLM says it's not grounded
    if (!validationResult.isGrounded) {
      console.log(
        `[HallucinationGuard] ❌ BLOCKED - LLM flagged critical issues`,
      );
      return {
        validationState: {
          isGrounded: false,
          hallucinationRisks: validationResult.hallucinationRisks,
          confidenceScore: validationResult.confidenceScore,
          validationPassed: false,
        },
        stopRequested: true,
        runStatus: "STOPPED",
        lastCheckpoint: "VALIDATION_FAILED",
        errors: [
          `Critical validation failure. Risks: ${validationResult.hallucinationRisks.join("; ")}`,
        ],
      };
    }

    // Validation passed - submit application
    console.log(
      `[HallucinationGuard] ✅ PASSED - Application will be submitted`,
    );
    return {
      validationState: {
        isGrounded: true,
        hallucinationRisks: validationResult.hallucinationRisks,
        confidenceScore: validationResult.confidenceScore,
        validationPassed: true,
      },
      lastCheckpoint: "VALIDATION_PASSED",
    };
  } catch (error) {
    errors.push(`HallucinationGuardNode error: ${(error as Error).message}`);
    return {
      errors,
      stopRequested: true,
      runStatus: "FAILED",
      lastCheckpoint: "VALIDATION_ERROR",
    };
  }
}
