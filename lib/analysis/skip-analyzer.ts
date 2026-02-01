/**
 * Skip Analyzer
 *
 * Analyzes skipped jobs using GPT-4o-mini to generate:
 * - AI reasoning for why job was skipped
 * - Missing skills list
 * - Missing experience
 * - Actionable suggestions (skills to learn, projects to build, resume improvements)
 */

import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { IJob } from "@/models/job.model";
import { IUser } from "@/models/user.model";

// Schema for skip analysis
const SkipAnalysisSchema = z.object({
  reasoning: z
    .string()
    .describe(
      "Clear explanation of why this job was skipped and why the candidate didn't match",
    ),
  missingSkills: z
    .array(z.string())
    .describe("Specific technical skills the candidate lacks for this role"),
  missingExperience: z
    .array(z.string())
    .describe("Experience or qualifications gaps"),
  suggestions: z.object({
    skillsToLearn: z
      .array(z.string())
      .describe("Top 3-5 skills to learn to qualify for similar roles"),
    projectsToAdd: z
      .array(z.string())
      .describe(
        "Specific project ideas to build that demonstrate required skills",
      ),
    resumeImprovements: z
      .array(z.string())
      .describe("How to improve resume to better match these roles"),
  }),
});

export interface SkipAnalysisResult {
  reasoning: string;
  missingSkills: string[];
  missingExperience: string[];
  suggestions: {
    skillsToLearn: string[];
    projectsToAdd: string[];
    resumeImprovements: string[];
  };
}

export async function analyzeSkippedJob(
  job: IJob,
  userSkills: string[],
  userExperience: string[],
  userProjects: string[],
  skipReason: string,
  matchScore?: number,
): Promise<SkipAnalysisResult> {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.3,
  });

  const prompt = `You are a career advisor analyzing why a job application was automatically skipped.

JOB DETAILS:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Required Skills: ${job.skills.join(", ")}
- Requirements: ${job.requirements.join("; ")}
- Description: ${job.description || "N/A"}

CANDIDATE PROFILE:
- Skills: ${userSkills.join(", ")}
- Experience: ${userExperience.join("; ")}
- Projects: ${userProjects.join("; ")}

SKIP REASON: ${skipReason}
${matchScore !== undefined ? `MATCH SCORE: ${matchScore}%` : ""}

TASK:
Provide a detailed analysis of why this job was skipped and actionable guidance for the candidate.

1. REASONING: Explain in 2-3 sentences why the candidate didn't match this role. Be specific about gaps.

2. MISSING SKILLS: List specific technical skills from the job requirements that the candidate lacks.

3. MISSING EXPERIENCE: List experience or qualification gaps (e.g., "3+ years Python", "AWS certification", "team lead experience").

4. SUGGESTIONS:
   - skillsToLearn: 3-5 most valuable skills to learn for roles like this (be specific, e.g., "React Hooks and Context API" not just "React")
   - projectsToAdd: 2-3 concrete project ideas they could build to demonstrate required skills (e.g., "Build a real-time chat app using WebSockets and Redis")
   - resumeImprovements: 2-3 specific ways to improve their resume/profile to better match these roles

Be constructive, specific, and actionable. Focus on helping the candidate qualify for similar roles in the future.`;

  const structuredLLM = llm.withStructuredOutput(SkipAnalysisSchema);
  const result = await structuredLLM.invoke(prompt);

  return result;
}
