/**
 * BullMQ Worker for Discovery Workflow
 *
 * Processes jobs from the discovery-jobs queue
 * Runs the Discovery Workflow with kill switch support
 */

import { Worker, Job } from "bullmq";
import { redisConnection } from "./connection";
import { DiscoveryJobData } from "./discovery-queue";
import { runDiscoveryWorkflow } from "../workflow/discovery-graph";
import { connectToDatabase } from "@/database/db";
import { AgentRun } from "@/models/agentrun.model";

/**
 * Process a single discovery job
 */
async function processDiscoveryJob(job: Job<DiscoveryJobData>) {
  const { agentRunId, userId } = job.data;

  console.log(
    `\n[Discovery Worker] 🔍 Starting discovery for AgentRun ${agentRunId}`,
  );

  try {
    await connectToDatabase();

    // Check kill switch before starting
    const agentRun = await AgentRun.findById(agentRunId);
    if (!agentRun) {
      throw new Error(`AgentRun not found: ${agentRunId}`);
    }

    if (agentRun.killSwitch || agentRun.status !== "RUNNING") {
      console.log(
        `[Discovery Worker] ⏹️ Kill switch activated or status is ${agentRun.status}. Stopping.`,
      );
      await AgentRun.findByIdAndUpdate(agentRunId, {
        status: "STOPPED",
        finishedAt: new Date(),
      });
      return { stopped: true };
    }

    console.log(`[Discovery Worker] ✓ Starting workflow...`);
    const result = await runDiscoveryWorkflow({
      agentRunId,
      userId,
    });

    console.log(
      `[Discovery Worker] ✅ Discovery completed: ${result.runStatus}`,
    );
    console.log(
      `[Discovery Worker] Jobs found: ${result.jobSearchState?.totalJobsFound || 0}`,
    );
    console.log(
      `[Discovery Worker] Jobs queued: ${result.queueState?.queuedJobIds.length || 0}`,
    );
    console.log(
      `[Discovery Worker] Jobs skipped: ${result.queueState?.skippedJobIds.length || 0}`,
    );

    // Detailed policy state logging
    if (result.policyState) {
      console.log(`[Discovery Worker] Policy State:`);
      console.log(
        `  - Allowed jobs: ${result.policyState.allowedJobIds.length}`,
      );
      console.log(
        `  - Skipped jobs: ${result.policyState.skippedJobIds.length}`,
      );
      console.log(`  - Applied today: ${result.policyState.appliedCountToday}`);

      if (
        result.policyState.skipReasons &&
        Object.keys(result.policyState.skipReasons).length > 0
      ) {
        console.log(`[Discovery Worker] Skip reasons:`);
        Object.entries(result.policyState.skipReasons).forEach(
          ([jobId, reason]) => {
            console.log(`  - ${jobId.substring(0, 8)}: ${reason}`);
          },
        );
      }
    }

    if (result.errors && result.errors.length > 0) {
      console.log(`[Discovery Worker] ⚠️ Errors:`, result.errors);
    }

    return result;
  } catch (error) {
    console.error(`[Discovery Worker] ❌ Error:`, (error as Error).message);
    console.error(`[Discovery Worker] Stack:`, (error as Error).stack);

    // Update AgentRun status on failure
    try {
      await AgentRun.findByIdAndUpdate(agentRunId, {
        status: "FAILED",
        finishedAt: new Date(),
      });
    } catch (updateError) {
      console.error(`[Discovery Worker] Failed to update status:`, updateError);
    }

    throw error;
  }
}

/**
 * Create and start the Discovery Worker
 */
export const discoveryWorker = new Worker<DiscoveryJobData>(
  "discovery-jobs",
  processDiscoveryJob,
  {
    connection: redisConnection,
    concurrency: 1, // Process one discovery at a time
    autorun: false, // Don't start automatically
  },
);

// Event handlers
discoveryWorker.on("completed", (job) => {
  console.log(`[Discovery Worker] ✅ Job ${job.id} completed`);
});

discoveryWorker.on("failed", (job, err) => {
  console.error(`[Discovery Worker] ❌ Job ${job?.id} failed:`, err.message);
});

discoveryWorker.on("error", (err) => {
  console.error(`[Discovery Worker] 💥 Worker error:`, err.message);
});

discoveryWorker.on("ready", () => {
  console.log(`[Discovery Worker] ✅ Connected to Redis and ready`);
});

// Start the worker
discoveryWorker
  .run()
  .then(() => {
    console.log(
      `[Discovery Worker] 🚀 Worker started and listening for jobs...`,
    );
  })
  .catch((err) => {
    console.error(`[Discovery Worker] ❌ Failed to start worker:`, err);
    process.exit(1);
  });
