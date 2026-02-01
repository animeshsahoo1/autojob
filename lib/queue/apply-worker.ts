/**
 * BullMQ Worker for Apply Workflow
 *
 * Processes jobs from the apply-jobs queue
 * Runs the Apply Workflow for each job
 */

import { Worker, Job } from "bullmq";
import { redisConnection } from "./connection";
import { ApplyJobData } from "./apply-queue";
import { runApplyWorkflow } from "../workflow/apply-graph";
import { connectToDatabase } from "@/database/db";
import { User } from "@/models/user.model";
import { ApplyQueue } from "@/models/applyqueue.model";

/**
 * Process a single apply job
 */
async function processApplyJob(job: Job<ApplyJobData>) {
  const { agentRunId, userId, jobId, queueRecordId, artifactState } = job.data;

  console.log(`\n[Worker] 📋 Processing job ${jobId} for user ${userId}`);
  console.log(`[Worker] Queue Record: ${queueRecordId}`);

  try {
    // 1. Connect to database
    await connectToDatabase();

    // 2. Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    console.log(`[Worker] ✓ User validated`);

    // 3. Run Apply Workflow (artifactState passed from Discovery or loaded by ArtifactNode)
    console.log(`[Worker] 🔄 Starting Apply Workflow...`);
    const result = await runApplyWorkflow({
      agentRunId,
      userId,
      jobId,
      artifactState: artifactState || null,
    });

    console.log(
      `[Worker] ✓ Apply Workflow completed with status: ${result.runStatus}`,
    );

    // 4. Update ApplyQueue record to mark as SENT (successfully processed by worker)
    try {
      await ApplyQueue.findByIdAndUpdate(queueRecordId, {
        status: "SENT",
        sentAt: new Date(),
      });
    } catch (updateError) {
      console.log(`[Worker] ⚠️ Could not update ApplyQueue:`, updateError);
    }

    console.log(`[Worker] ✅ Job ${jobId} completed: ${result.runStatus}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`[Worker] ⚠️ Errors encountered:`, result.errors);
    }

    return result;
  } catch (error) {
    console.error(`[Worker] ❌ Error processing job ${jobId}:`);
    console.error(`[Worker] Error message: ${(error as Error).message}`);
    console.error(`[Worker] Stack trace:`, (error as Error).stack);

    // Update ApplyQueue status on error
    try {
      await ApplyQueue.findByIdAndUpdate(queueRecordId, {
        status: "SENT", // Mark as sent even if failed, so we don't retry
        sentAt: new Date(),
      });
    } catch (updateError) {
      console.error(`[Worker] Failed to update queue status:`, updateError);
    }

    throw error; // Let BullMQ handle retries
  }
}

/**
 * Create and start the Apply Worker
 */
export function createApplyWorker() {
  const worker = new Worker<ApplyJobData>("apply-jobs", processApplyJob, {
    connection: redisConnection,
    concurrency: 5, // Process 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per 60 seconds (rate limiting)
    },
  });

  // Event handlers
  worker.on("completed", (job) => {
    console.log(`[Worker] ✅ Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[Worker] ❌ Job ${job?.id} failed after ${job?.attemptsMade} attempts`,
    );
    console.error(`[Worker] Error: ${err.message}`);
  });

  worker.on("error", (err) => {
    console.error("[Worker] 🔴 Worker error:", err);
  });

  console.log("[Worker] 🚀 Apply worker started, waiting for jobs...");
  console.log("[Worker] Concurrency: 5 jobs");
  console.log("[Worker] Rate limit: 10 jobs per 60 seconds\n");

  return worker;
}

// Start worker if run directly
if (require.main === module) {
  createApplyWorker();
}
