/**
 * Discovery Workflow (Job Finder Worker)
 *
 * Runs once per AgentRun
 *
 * Flow:
 * START → LoadRunNode → ArtifactNode → JobDiscoveryNode → QueueDecisionNode → FinalizeNode → END
 *
 * Outputs:
 * - Job records
 * - JobMatch records
 * - ApplyQueue records
 * - BullMQ jobs enqueued (one per eligible job)
 *
 * No applications happen in this workflow.
 */

import { StateGraph, END } from "@langchain/langgraph";
import { JobApplyAgentStateAnnotation } from "./state";
import { loadRunNode } from "./nodes/load-run";
import { artifactNode } from "./nodes/artifact";
import { jobDiscoveryNode } from "./nodes/job-discovery";
import { queueDecisionNode } from "./nodes/queue-decision";
import { finalizeNode } from "./nodes/finalize";
import { enqueueApplyJob } from "../queue/apply-queue";
import { connectToDatabase } from "@/database/db";
import { ApplyQueue } from "@/models/applyqueue.model";

/**
 * Create the Discovery workflow graph
 */
export function createDiscoveryGraph() {
  const workflow = new StateGraph(JobApplyAgentStateAnnotation)
    // Add nodes
    .addNode("load_run", loadRunNode)
    .addNode("artifact", artifactNode)
    .addNode("job_discovery", jobDiscoveryNode)
    .addNode("queue_decision", queueDecisionNode)
    .addNode("finalize", finalizeNode)

    // Define edges
    .addEdge("__start__", "load_run")
    .addEdge("load_run", "artifact")
    .addEdge("artifact", "job_discovery")
    .addEdge("job_discovery", "queue_decision")
    .addEdge("queue_decision", "finalize")
    .addEdge("finalize", END);

  return workflow.compile();
}

/**
 * Run the Discovery workflow and enqueue apply jobs
 */
export async function runDiscoveryWorkflow(input: {
  agentRunId: string;
  userId: string;
}) {
  const graph = createDiscoveryGraph();

  const result = await graph.invoke({
    agentRunId: input.agentRunId,
    userId: input.userId,
    stopRequested: false,
    runStatus: "RUNNING" as const,
    errors: [],
  });

  // After discovery completes, enqueue apply jobs for queued jobs
  if (
    result.queueState?.queuedJobIds &&
    result.queueState.queuedJobIds.length > 0
  ) {
    await connectToDatabase();

    console.log(
      `[Discovery] Enqueueing ${result.queueState.queuedJobIds.length} jobs for application`,
    );

    // Fetch ApplyQueue records to get their IDs
    const queueRecords = await ApplyQueue.find({
      agentRunId: input.agentRunId,
      status: "QUEUED",
    }).lean();

    // Enqueue each job to BullMQ with artifactState
    const enqueuePromises = queueRecords.map((record) =>
      enqueueApplyJob({
        agentRunId: input.agentRunId,
        userId: input.userId,
        jobId: (record.jobId as any).toString(),
        queueRecordId: (record._id as any).toString(),
        artifactState: result.artifactState, // Pass artifacts from Discovery
      }),
    );

    await Promise.all(enqueuePromises);

    console.log(`[Discovery] Enqueued ${queueRecords.length} jobs to BullMQ`);
  }

  return result;
}
