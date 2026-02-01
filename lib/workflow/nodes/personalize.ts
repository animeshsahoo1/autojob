/**
 * PersonalizeNode
 *
 * Selects the best resume variant for the job and generates:
 * - Requirement-to-evidence mapping
 * - Job-specific cover letter or intro
 * - Answers to screening questions
 * - Confidence levels (strong/medium/weak) for each claim
 *
 * All content must be grounded in student's actual artifacts.
 *
 * What it does:
 * 1. Pick the best resume variant for the job
 * 2. Generate requirement-to-evidence mapping using LLM
 * 3. Generate answers to screening questions (if any)
 * 4. Assign confidence levels (strong/medium/weak)
 * 5. Updates personalizationState
 *
 * What it does NOT do:
 * ❌ No applying
 * ❌ No database writes (only reads)
 */

import { JobApplyAgentState } from "../state";
import { connectToDatabase } from "@/database/db";
import { Job, IJob } from "@/models/job.model";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import mongoose from "mongoose";

// Schema for requirement-to-evidence mapping
const RequirementEvidenceSchema = z.object({
  requirements: z.array(
    z.object({
      requirement: z.string(),
      evidence: z.string(),
      confidence: z.enum(["strong", "medium", "weak"]),
    }),
  ),
});

// Schema for screening question answers
const ScreeningAnswerSchema = z.object({
  answers: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
});

/**
 * Select the best resume variant based on job requirements
 */
function selectResumeVariant(
  job: IJob,
  resumeVariants: { name: string; url: string }[],
  studentSkills: string[],
): string {
  if (resumeVariants.length === 0) return "base";
  if (resumeVariants.length === 1) return resumeVariants[0].name;

  // Simple heuristic: match variant name with job title or skills
  const jobTitleLower = job.title.toLowerCase();
  const jobSkillsLower = job.skills.map((s) => s.toLowerCase());

  for (const variant of resumeVariants) {
    const variantNameLower = variant.name.toLowerCase();
    if (
      jobTitleLower.includes(variantNameLower) ||
      jobSkillsLower.some((skill) => variantNameLower.includes(skill))
    ) {
      return variant.name;
    }
  }

  // Default to first variant if no match
  return resumeVariants[0].name;
}

export async function personalizeNode(
  state: JobApplyAgentState,
): Promise<Partial<JobApplyAgentState>> {
  await connectToDatabase();

  const errors: string[] = [];

  try {
    // Validate required state
    if (!state.artifactState) {
      throw new Error("Artifact state not loaded. Run ArtifactNode first.");
    }

    // Determine current job ID:
    // 1. If personalizationState.currentJobId exists, use it (Apply workflow)
    // 2. If queueState.queuedJobIds exists, use first job (Discovery workflow)
    // 3. If state.jobId exists, use it (passed directly from Apply workflow)
    let currentJobId: string;

    if (state.personalizationState?.currentJobId) {
      currentJobId = state.personalizationState.currentJobId;
    } else if (state.jobId) {
      currentJobId = state.jobId;
    } else if (
      state.queueState?.queuedJobIds &&
      state.queueState.queuedJobIds.length > 0
    ) {
      currentJobId = state.queueState.queuedJobIds[0];
    } else {
      throw new Error(
        "No job ID found. Pass jobId or run QueueDecisionNode first.",
      );
    }

    // Fetch job details
    const job = (await Job.findById(currentJobId).lean()) as unknown as IJob;
    if (!job) {
      throw new Error(`Job not found: ${currentJobId}`);
    }

    const {
      studentProfile,
      resumeVariants = [],
      bulletBank = [],
      proofLinks = [],
    } = state.artifactState;

    if (!studentProfile) {
      throw new Error("Student profile not found in artifact state.");
    }

    // 1. Select best resume variant
    const resumeVariantUsed = selectResumeVariant(
      job,
      resumeVariants,
      studentProfile.skills,
    );

    // 2. Generate requirement-to-evidence mapping using LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.3,
    });

    const requirementPrompt = `You are a job application assistant. Map each job requirement to evidence from the student's profile.

Job Title: ${job.title}
Company: ${job.company}
Requirements: ${job.requirements.join(", ")}

Student Profile:
- Skills: ${studentProfile.skills.join(", ")}
- Education: ${studentProfile.education.join(", ")}
- Experience: ${studentProfile.experience.join(", ")}
- Projects: ${studentProfile.projects.join(", ")}
- Bullet Bank: ${bulletBank.slice(0, 10).join(", ")}

For each requirement, provide:
1. The requirement
2. Evidence from student's profile that matches it
3. Confidence level: "strong" (direct match), "medium" (partial match), or "weak" (tangential match)

IMPORTANT: Only use evidence that actually exists in the student's profile. Do not fabricate or exaggerate.`;

    const structuredLLM = llm.withStructuredOutput(RequirementEvidenceSchema);
    const mappingResult = await structuredLLM.invoke(requirementPrompt);

    // Build requirement-evidence map
    const requirementEvidenceMap: Record<string, string> = {};
    let strongCount = 0;
    let mediumCount = 0;
    let weakCount = 0;

    mappingResult.requirements.forEach((item) => {
      requirementEvidenceMap[item.requirement] = item.evidence;
      if (item.confidence === "strong") strongCount++;
      else if (item.confidence === "medium") mediumCount++;
      else if (item.confidence === "weak") weakCount++;
    });

    // 3. Generate answers to screening questions (if any)
    let answeredQuestions: { question: string; answer: string }[] = [];

    if (job.questions && job.questions.length > 0) {
      const questionsPrompt = `You are helping a student answer job screening questions based on their profile.

Job Title: ${job.title}
Company: ${job.company}

Student Profile:
- Skills: ${studentProfile.skills.join(", ")}
- Education: ${studentProfile.education.join(", ")}
- Experience: ${studentProfile.experience.join(", ")}
- Projects: ${studentProfile.projects.join(", ")}

Questions:
${job.questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}

Provide concise, professional answers grounded in the student's actual profile. Do not fabricate experience or skills.`;

      const questionStructuredLLM = llm.withStructuredOutput(
        ScreeningAnswerSchema,
      );
      const answersResult = await questionStructuredLLM.invoke(questionsPrompt);
      answeredQuestions = answersResult.answers;
    }

    // 4. Return personalization state
    return {
      personalizationState: {
        currentJobId,
        resumeVariantUsed,
        requirementEvidenceMap,
        confidenceLevels: {
          strong: strongCount,
          medium: mediumCount,
          weak: weakCount,
        },
        answeredQuestions,
      },
      lastCheckpoint: "PERSONALIZED",
    };
  } catch (error) {
    errors.push(`PersonalizeNode error: ${(error as Error).message}`);
    return {
      errors,
      stopRequested: true,
      runStatus: "FAILED",
      lastCheckpoint: "PERSONALIZE_FAILED",
    };
  }
}
