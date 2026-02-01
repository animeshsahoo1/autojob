/**
 * QueueDecisionNode
 *
 * Writes ApplyQueue entries for each job, marking them as:
 * - QUEUED: Ready for application
 * - SKIPPED: Blocked by policy or low match score
 *
 * Tracks skip reasons (policy block, low score, missing evidence,
 * company cooldown, duplicate, kill switch) and cooldown periods.
 *
 * What it does:
 * 1. Takes results from JobDiscoveryNode (allowedJobIds, skippedJobIds)
 * 2. Checks for existing ApplyQueue entries (idempotency)
 * 3. Writes ApplyQueue records:
 *    - QUEUED for eligible jobs
 *    - SKIPPED with reason for blocked jobs
 * 4. Updates queueState with queued/skipped/cooldown lists
 * 5. Sets checkpoint to "QUEUE_READY"
 *
 * What it does NOT do:
 * ❌ No generation
 * ❌ No API calls
 * ❌ No personalization
 * ❌ No applying
 */

import { JobApplyAgentState } from "../state";
import { connectToDatabase } from "@/database/db";
import { ApplyQueue } from "@/models/applyqueue.model";
import { Job, IJob } from "@/models/job.model";
import { User, IUser } from "@/models/user.model";
import { Resume, IResume } from "@/models/resume.model";
import { analyzeSkippedJob } from "@/lib/analysis/skip-analyzer";
import mongoose from "mongoose";

/**
 * Map skip reason text to ApplyQueue enum values
 */
function mapSkipReason(
  reasonText: string,
):
  | "POLICY_BLOCK"
  | "LOW_MATCH_SCORE"
  | "MISSING_EVIDENCE"
  | "COMPANY_COOLDOWN"
  | "DUPLICATE"
  | "KILL_SWITCH" {
  if (reasonText.includes("LOW_MATCH_SCORE")) return "LOW_MATCH_SCORE";
  if (
    reasonText.includes("BLOCKED_COMPANY") ||
    reasonText.includes("BLOCKED_ROLE")
  )
    return "POLICY_BLOCK";
  if (reasonText.includes("COMPANY_COOLDOWN")) return "COMPANY_COOLDOWN";
  if (reasonText.includes("MAX_APPLICATIONS_REACHED")) return "POLICY_BLOCK";
  if (reasonText.includes("DUPLICATE")) return "DUPLICATE";
  if (reasonText.includes("KILL_SWITCH")) return "KILL_SWITCH";
  return "POLICY_BLOCK"; // default
}

export async function queueDecisionNode(
  state: JobApplyAgentState,
): Promise<Partial<JobApplyAgentState>> {
  await connectToDatabase();

  const errors: string[] = [];

  try {
    // Validate required state
    if (!state.policyState) {
      throw new Error("Policy state not loaded. Run JobDiscoveryNode first.");
    }

    const { allowedJobIds, skippedJobIds, skipReasons } = state.policyState;

    // 1. Check for existing ApplyQueue entries (idempotency)
    const allJobIds = [...allowedJobIds, ...skippedJobIds].map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const existingQueueEntries = await ApplyQueue.find({
      agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
      jobId: { $in: allJobIds },
    }).lean();

    const existingJobIdsSet = new Set(
      existingQueueEntries.map((entry: any) => entry.jobId.toString()),
    );

    // Filter out already queued jobs
    const newAllowedJobIds = allowedJobIds.filter(
      (jobId) => !existingJobIdsSet.has(jobId),
    );
    const newSkippedJobIds = skippedJobIds.filter(
      (jobId) => !existingJobIdsSet.has(jobId),
    );

    // 2. Create ApplyQueue entries for QUEUED jobs
    const queuedEntries = newAllowedJobIds.map((jobId) => ({
      agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
      jobId: new mongoose.Types.ObjectId(jobId),
      userId: new mongoose.Types.ObjectId(state.userId),
      status: "QUEUED" as const,
      queuedAt: new Date(),
    }));

    // 3. Create ApplyQueue entries for SKIPPED jobs (with AI analysis)
    const skippedEntries = [];

    for (const jobId of newSkippedJobIds) {
      const reasonText = skipReasons[jobId] || "POLICY_BLOCK";
      const skipReason = mapSkipReason(reasonText);

      // Calculate cooldown date for company cooldown reasons
      let cooldownUntil: Date | undefined = undefined;
      if (skipReason === "COMPANY_COOLDOWN" && state.applyPolicy) {
        cooldownUntil = new Date();
        cooldownUntil.setDate(
          cooldownUntil.getDate() + state.applyPolicy.companyCooldownDays,
        );
      }

      // Generate AI analysis for skipped job
      let skipAnalysis = null;
      try {
        // Fetch job details
        const job = (await Job.findById(jobId).lean()) as unknown as IJob;

        // Get user profile from artifactState or fetch from DB
        let userSkills: string[] = [];
        let userExperience: string[] = [];
        let userProjects: string[] = [];

        if (state.artifactState?.studentProfile) {
          userSkills = state.artifactState.studentProfile.skills;
          userExperience = state.artifactState.studentProfile.experience;
          userProjects = state.artifactState.studentProfile.projects;
        } else {
          // Fallback: fetch from user's resumes
          const user = (await User.findById(
            state.userId,
          ).lean()) as unknown as IUser;
          if (user?.resumes && user.resumes.length > 0) {
            const resume = (await Resume.findById(
              user.resumes[0],
            ).lean()) as unknown as IResume;
            if (resume) {
              userSkills = resume.skills?.technical || [];
              userExperience =
                resume.workExperience?.map((exp) => exp.position) || [];
              userProjects = resume.projects?.map((proj) => proj.name) || [];
            }
          }
        }

        if (job && userSkills.length > 0) {
          const matchScore = state.rankingState?.rankedJobIds?.find(
            (rj: any) => rj.jobId === jobId,
          )?.matchScore;

          skipAnalysis = await analyzeSkippedJob(
            job,
            userSkills,
            userExperience,
            userProjects,
            reasonText,
            matchScore,
          );
        }
      } catch (analysisError) {
        console.error(`Failed to analyze skipped job ${jobId}:`, analysisError);
        // Continue without analysis
      }

      skippedEntries.push({
        agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
        jobId: new mongoose.Types.ObjectId(jobId),
        userId: new mongoose.Types.ObjectId(state.userId),
        status: "SKIPPED" as const,
        skipReason,
        cooldownUntil,
        queuedAt: new Date(),
        // Add AI analysis if available
        ...(skipAnalysis && {
          skipReasoning: skipAnalysis.reasoning,
          missingSkills: skipAnalysis.missingSkills,
          missingExperience: skipAnalysis.missingExperience,
          suggestions: skipAnalysis.suggestions,
        }),
      });
    }

    // 4. Insert all entries
    const allEntries = [...queuedEntries, ...skippedEntries];
    if (allEntries.length > 0) {
      await ApplyQueue.insertMany(allEntries);
    }

    // 5. Identify cooldown jobs
    const cooldownJobIds = newSkippedJobIds.filter((jobId) => {
      const reasonText = skipReasons[jobId] || "";
      return reasonText.includes("COMPANY_COOLDOWN");
    });

    // 6. Return state updates
    return {
      queueState: {
        queuedJobIds: newAllowedJobIds,
        skippedJobIds: newSkippedJobIds,
        cooldownJobIds,
      },
      lastCheckpoint: "QUEUE_READY",
    };
  } catch (error) {
    errors.push(`QueueDecisionNode error: ${(error as Error).message}`);
    return {
      errors,
      stopRequested: true,
      runStatus: "FAILED",
      lastCheckpoint: "QUEUE_DECISION_FAILED",
    };
  }
}
