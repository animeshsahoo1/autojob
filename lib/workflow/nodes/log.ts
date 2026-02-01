/**
 * LogNode
 *
 * Writes structured AgentLog entries for:
 * - Stage transitions (ARTIFACT, SEARCH, RANK, POLICY, etc.)
 * - Level (INFO, WARN, ERROR)
 * - Detailed messages with metadata
 * - Job-specific events
 *
 * Provides full observability and debugging trail for the agent run.
 *
 * What it does:
 * 1. Writes structured AgentLog entries for node transitions
 * 2. Logs decisions made at each stage
 * 3. Logs errors encountered
 * 4. Updates logState with log count
 *
 * What it does NOT do:
 * ❌ No state changes besides logging
 * ❌ No API calls
 * ❌ No generation
 */

import { JobApplyAgentState } from "../state";
import { connectToDatabase } from "@/database/db";
import { AgentLog } from "@/models/agentlog.model";
import mongoose from "mongoose";

/**
 * Map checkpoint to stage enum
 */
function mapCheckpointToStage(
  checkpoint: string | undefined,
):
  | "ARTIFACT"
  | "SEARCH"
  | "RANK"
  | "POLICY"
  | "QUEUE"
  | "PERSONALIZE"
  | "APPLY"
  | "VALIDATION"
  | "SYSTEM" {
  if (!checkpoint) return "SYSTEM";

  if (checkpoint.includes("ARTIFACT")) return "ARTIFACT";
  if (checkpoint.includes("DISCOVERY") || checkpoint.includes("SEARCH"))
    return "SEARCH";
  if (checkpoint.includes("RANK")) return "RANK";
  if (checkpoint.includes("POLICY")) return "POLICY";
  if (checkpoint.includes("QUEUE")) return "QUEUE";
  if (checkpoint.includes("PERSONALIZE")) return "PERSONALIZE";
  if (checkpoint.includes("APPLY")) return "APPLY";
  if (checkpoint.includes("VALIDATION")) return "VALIDATION";

  return "SYSTEM";
}

export async function logNode(
  state: JobApplyAgentState,
): Promise<Partial<JobApplyAgentState>> {
  await connectToDatabase();

  const errors: string[] = [];

  try {
    const logs: any[] = [];

    // Determine log level based on state
    const hasErrors = state.errors && state.errors.length > 0;
    const isStopped = state.stopRequested || state.runStatus === "STOPPED";
    const isFailed = state.runStatus === "FAILED";

    const level = isFailed || hasErrors ? "ERROR" : isStopped ? "WARN" : "INFO";
    const stage = mapCheckpointToStage(state.lastCheckpoint);

    // 1. Log checkpoint/stage transition
    if (state.lastCheckpoint) {
      logs.push({
        agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
        userId: new mongoose.Types.ObjectId(state.userId),
        jobId: state.personalizationState?.currentJobId
          ? new mongoose.Types.ObjectId(state.personalizationState.currentJobId)
          : undefined,
        stage,
        level,
        message: `Checkpoint reached: ${state.lastCheckpoint}`,
        metadata: {
          checkpoint: state.lastCheckpoint,
          runStatus: state.runStatus,
          stopRequested: state.stopRequested,
        },
      });
    }

    // 2. Log job discovery results
    if (state.jobSearchState) {
      logs.push({
        agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
        userId: new mongoose.Types.ObjectId(state.userId),
        stage: "SEARCH",
        level: "INFO",
        message: `Job search completed: ${state.jobSearchState.totalJobsFound} jobs found, ${state.jobSearchState.deduplicatedCount} new jobs`,
        metadata: {
          totalJobsFound: state.jobSearchState.totalJobsFound,
          deduplicatedCount: state.jobSearchState.deduplicatedCount,
          fetchedJobIds: state.jobSearchState.fetchedJobIds.slice(0, 10),
        },
      });
    }

    // 3. Log policy decisions
    if (state.policyState) {
      logs.push({
        agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
        userId: new mongoose.Types.ObjectId(state.userId),
        stage: "POLICY",
        level: "INFO",
        message: `Policy check completed: ${state.policyState.allowedJobIds.length} allowed, ${state.policyState.skippedJobIds.length} skipped`,
        metadata: {
          allowedCount: state.policyState.allowedJobIds.length,
          skippedCount: state.policyState.skippedJobIds.length,
          appliedCountToday: state.policyState.appliedCountToday,
          skipReasons: Object.keys(state.policyState.skipReasons).slice(0, 5),
        },
      });
    }

    // 4. Log validation results
    if (state.validationState) {
      logs.push({
        agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
        userId: new mongoose.Types.ObjectId(state.userId),
        jobId: state.personalizationState?.currentJobId
          ? new mongoose.Types.ObjectId(state.personalizationState.currentJobId)
          : undefined,
        stage: "VALIDATION",
        level: state.validationState.validationPassed ? "INFO" : "WARN",
        message: state.validationState.validationPassed
          ? `Validation passed with confidence score: ${state.validationState.confidenceScore}`
          : `Validation failed: ${state.validationState.hallucinationRisks.length} risks detected`,
        metadata: {
          isGrounded: state.validationState.isGrounded,
          confidenceScore: state.validationState.confidenceScore,
          hallucinationRisks: state.validationState.hallucinationRisks,
        },
      });
    }

    // 5. Log application results
    if (state.applyResultState) {
      logs.push({
        agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
        userId: new mongoose.Types.ObjectId(state.userId),
        jobId: state.personalizationState?.currentJobId
          ? new mongoose.Types.ObjectId(state.personalizationState.currentJobId)
          : undefined,
        stage: "APPLY",
        level:
          state.applyResultState.applyStatus === "SUBMITTED" ? "INFO" : "ERROR",
        message: `Application ${state.applyResultState.applyStatus} after ${state.applyResultState.attempts} attempt(s)`,
        metadata: {
          applicationId: state.applyResultState.applicationId,
          status: state.applyResultState.applyStatus,
          attempts: state.applyResultState.attempts,
          receipt: state.applyResultState.receipt,
          error: state.applyResultState.error,
        },
      });
    }

    // 6. Log errors
    if (hasErrors) {
      logs.push({
        agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
        userId: new mongoose.Types.ObjectId(state.userId),
        stage: "SYSTEM",
        level: "ERROR",
        message: `Errors encountered: ${state.errors?.join("; ")}`,
        metadata: {
          errors: state.errors,
          checkpoint: state.lastCheckpoint,
        },
      });
    }

    // 7. Insert all logs
    if (logs.length > 0) {
      const insertedLogs = await AgentLog.insertMany(logs);
      const lastLogId = insertedLogs[insertedLogs.length - 1]._id.toString();

      return {
        logState: {
          logsWritten: (state.logState?.logsWritten || 0) + logs.length,
          lastLogId,
        },
      };
    }

    return {};
  } catch (error) {
    errors.push(`LogNode error: ${(error as Error).message}`);
    // Don't fail the workflow for logging errors
    return {
      errors,
    };
  }
}
