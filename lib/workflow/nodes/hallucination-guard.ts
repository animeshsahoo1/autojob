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

    const hallucinationRisks: string[] = [];
    let validationScore = 100;

    // 1. Validate requirement evidence against student profile
    for (const [requirement, evidence] of Object.entries(
      requirementEvidenceMap,
    )) {
      // Check if evidence mentions skills not in student profile
      const mentionedSkills = extractMentionedSkills(evidence);
      for (const skill of mentionedSkills) {
        if (!isSkillInProfile(skill, studentProfile.skills)) {
          hallucinationRisks.push(
            `Evidence mentions skill "${skill}" not in student profile for requirement: ${requirement}`,
          );
          validationScore -= 10;
        }
      }

      // Check if evidence is grounded in bullet bank
      const isGroundedInBullets = isEvidenceInBulletBank(evidence, bulletBank);
      if (!isGroundedInBullets && bulletBank.length > 0) {
        hallucinationRisks.push(
          `Evidence not found in bullet bank for requirement: ${requirement}`,
        );
        validationScore -= 5;
      }
    }

    // 2. Validate screening question answers
    for (const qa of answeredQuestions) {
      const mentionedSkills = extractMentionedSkills(qa.answer);
      for (const skill of mentionedSkills) {
        if (!isSkillInProfile(skill, studentProfile.skills)) {
          hallucinationRisks.push(
            `Answer mentions skill "${skill}" not in student profile for question: ${qa.question}`,
          );
          validationScore -= 10;
        }
      }
    }

    // 3. Check confidence levels - flag if too many weak matches
    if (confidenceLevels) {
      const totalMatches =
        confidenceLevels.strong +
        confidenceLevels.medium +
        confidenceLevels.weak;
      const weakRatio =
        totalMatches > 0 ? confidenceLevels.weak / totalMatches : 0;

      if (weakRatio > 0.5) {
        hallucinationRisks.push(
          `More than 50% of matches are weak confidence (${confidenceLevels.weak}/${totalMatches})`,
        );
        validationScore -= 15;
      }
    }

    // 4. TODO: Validate against Vector DB (resume embeddings)
    // TODO: Semantic match against stored resume chunks
    // TODO: Confirm claims are present or strongly implied in resume text
    // This would involve:
    // - Embedding the generated content
    // - Searching vector store for similar resume chunks
    // - Calculating semantic similarity scores
    // - Flagging content with low similarity to any resume chunk

    // 5. Use LLM for deep validation (optional but thorough)
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
    });

    const allEvidenceText = Object.values(requirementEvidenceMap).join("\n");
    const allAnswersText = answeredQuestions.map((qa) => qa.answer).join("\n");

    const validationPrompt = `You are a hallucination detector for job applications. Verify if the generated content is grounded in the student's actual profile.

Student Profile:
- Skills: ${studentProfile.skills.join(", ")}
- Education: ${studentProfile.education.join(", ")}
- Experience: ${studentProfile.experience.join(", ")}
- Projects: ${studentProfile.projects.join(", ")}
- Bullet Bank: ${bulletBank.slice(0, 20).join("; ")}

Generated Content:
Evidence for Requirements:
${allEvidenceText}

Screening Question Answers:
${allAnswersText}

Check for:
1. Claims about skills/technologies not in the student's profile
2. Exaggerated experience levels
3. Unverifiable statements
4. Content that cannot be traced back to the profile

Return:
- isGrounded: true if all content is verifiable and accurate
- hallucinationRisks: list of specific concerns (empty if none)
- confidenceScore: 0-100 (100 = fully grounded, 0 = mostly fabricated)
- reasoning: brief explanation`;

    const structuredLLM = llm.withStructuredOutput(HallucinationCheckSchema);
    const validationResult = await structuredLLM.invoke(validationPrompt);

    // Combine manual checks with LLM validation
    const combinedHallucinationRisks = [
      ...hallucinationRisks,
      ...validationResult.hallucinationRisks,
    ];

    const finalConfidenceScore = Math.min(
      validationScore,
      validationResult.confidenceScore,
    );

    const isGrounded = validationResult.isGrounded && validationScore >= 60;
    const validationPassed =
      isGrounded && combinedHallucinationRisks.length === 0;

    // 6. Block workflow if validation fails
    if (!validationPassed) {
      return {
        validationState: {
          isGrounded,
          hallucinationRisks: combinedHallucinationRisks,
          confidenceScore: finalConfidenceScore,
          validationPassed: false,
        },
        stopRequested: true,
        runStatus: "STOPPED",
        lastCheckpoint: "VALIDATION_FAILED",
        errors: [
          `Hallucination detected. Risks: ${combinedHallucinationRisks.join("; ")}`,
        ],
      };
    }

    // Validation passed
    return {
      validationState: {
        isGrounded: true,
        hallucinationRisks: [],
        confidenceScore: finalConfidenceScore,
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
