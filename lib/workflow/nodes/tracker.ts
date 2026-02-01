/**
 * TrackerNode
 *
 * Updates Application and AgentRun records:
 * - Application timeline (searched, ranked, personalized, applied, submitted)
 * - Application status and attempts
 * - Run counters (appliedCountToday, skippedCountToday)
 * - Last checkpoint for resumability
 *
 * Ensures data consistency and audit trail.
 *
 * What it does:
 * 1. Updates Application record with final status, attempts, receipt/error
 * 2. Appends timeline events (APPLIED, SUBMITTED, FAILED)
 * 3. Updates AgentRun counters (appliedCountToday, skippedCountToday)
 * 4. Updates lastCheckpoint in AgentRun
 * 5. Writes completion-related state
 *
 * What it does NOT do:
 * ❌ No generation
 * ❌ No policy logic
 * ❌ No API calls
 */

import { JobApplyAgentState } from "../state";
import { connectToDatabase } from "@/database/db";
import { Application } from "@/models/application.model";
import { AgentRun } from "@/models/agentrun.model";
import mongoose from "mongoose";

export async function trackerNode(
  state: JobApplyAgentState,
): Promise<Partial<JobApplyAgentState>> {
  await connectToDatabase();

  const errors: string[] = [];

  try {
    // Validate required state
    if (!state.applyResultState) {
      throw new Error("Apply result state not found. Run ApplyNode first.");
    }

    const { applicationId, applyStatus, receipt, error, attempts } =
      state.applyResultState;

    if (!applicationId) {
      throw new Error("Application ID not found in apply result state.");
    }

    // 1. Update Application record
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new Error(`Application not found: ${applicationId}`);
    }

    // Update status, attempts, receipt, error (if not already done in ApplyNode)
    application.status = applyStatus || "FAILED";
    application.attempts = attempts;
    if (receipt) application.receipt = receipt;
    if (error) application.error = error;

    // Append timeline event if not already added
    const hasAppliedStage = application.timeline.some(
      (t) => t.stage === "APPLIED",
    );
    if (!hasAppliedStage) {
      application.timeline.push({
        stage: "APPLIED",
        timestamp: new Date(),
        message: `Application attempt completed with status: ${applyStatus}`,
      });
    }

    await application.save();

    // 2. Update AgentRun counters
    const agentRun = await AgentRun.findById(state.agentRunId);
    if (!agentRun) {
      throw new Error(`AgentRun not found: ${state.agentRunId}`);
    }

    // Increment counters based on apply status
    if (applyStatus === "SUBMITTED") {
      agentRun.appliedCountToday += 1;
    } else {
      agentRun.skippedCountToday += 1;
    }

    // Update last checkpoint
    agentRun.lastCheckpoint = state.lastCheckpoint || "TRACKER";

    await agentRun.save();

    // 3. Update policyState counters in state
    const updatedAppliedCount =
      applyStatus === "SUBMITTED"
        ? (state.policyState?.appliedCountToday || 0) + 1
        : state.policyState?.appliedCountToday || 0;

    const updatedSkippedCount =
      applyStatus !== "SUBMITTED"
        ? (state.policyState?.skippedCountToday || 0) + 1
        : state.policyState?.skippedCountToday || 0;

    // 4. Return state updates
    return {
      policyState: {
        ...state.policyState,
        allowedJobIds: state.policyState?.allowedJobIds || [],
        skippedJobIds: state.policyState?.skippedJobIds || [],
        skipReasons: state.policyState?.skipReasons || {},
        appliedCountToday: updatedAppliedCount,
        policiesChecked: state.policyState?.policiesChecked || [],
      },
      lastCheckpoint: "TRACKER",
    };
  } catch (error) {
    errors.push(`TrackerNode error: ${(error as Error).message}`);
    return {
      errors,
      stopRequested: true,
      runStatus: "FAILED",
      lastCheckpoint: "TRACKER_FAILED",
    };
  }
}
