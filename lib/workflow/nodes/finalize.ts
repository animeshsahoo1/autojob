/**
 * FinalizeNode
 *
 * Marks AgentRun as completed, stopped, or failed:
 * - COMPLETED: Successfully processed all jobs
 * - STOPPED: Manually stopped via kill switch
 * - FAILED: Encountered unrecoverable error
 *
 * Sets finishedAt timestamp and final status.
 *
 * What it does:
 * 1. Determines final status based on state
 * 2. Updates AgentRun with final status and finishedAt
 * 3. Ends the LangGraph run
 *
 * Status mapping:
 * - COMPLETED: No errors, not stopped, successfully processed jobs
 * - STOPPED: stopRequested=true or runStatus=STOPPED
 * - FAILED: Has errors or runStatus=FAILED
 */

import { JobApplyAgentState } from "../state";
import { connectToDatabase } from "@/database/db";
import { AgentRun } from "@/models/agentrun.model";

export async function finalizeNode(
  state: JobApplyAgentState,
): Promise<Partial<JobApplyAgentState>> {
  await connectToDatabase();

  const errors: string[] = [];

  try {
    // Fetch AgentRun
    const agentRun = await AgentRun.findById(state.agentRunId);
    if (!agentRun) {
      throw new Error(`AgentRun not found: ${state.agentRunId}`);
    }

    // 1. Determine final status
    let finalStatus: "COMPLETED" | "STOPPED" | "FAILED";

    if (
      state.runStatus === "FAILED" ||
      (state.errors && state.errors.length > 0)
    ) {
      finalStatus = "FAILED";
    } else if (state.stopRequested || state.runStatus === "STOPPED") {
      finalStatus = "STOPPED";
    } else {
      finalStatus = "COMPLETED";
    }

    // 2. Update AgentRun
    agentRun.status = finalStatus;
    agentRun.finishedAt = new Date();
    agentRun.lastCheckpoint = "FINALIZED";

    await agentRun.save();

    // 3. Return final state
    return {
      runStatus: finalStatus,
      lastCheckpoint: "FINALIZED",
    };
  } catch (error) {
    errors.push(`FinalizeNode error: ${(error as Error).message}`);
    return {
      errors,
      runStatus: "FAILED",
      lastCheckpoint: "FINALIZE_FAILED",
    };
  }
}
