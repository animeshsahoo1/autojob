/**
 * BullMQ Queue for Apply Workflow
 *
 * Jobs are enqueued by Discovery Workflow after QueueDecisionNode
 * Workers process each job through the Apply Workflow
 */

import { Queue } from "bullmq";
import { redisConnection } from "./connection";
import { ArtifactState } from "../workflow/state";

export interface ApplyJobData {
  agentRunId: string;
  userId: string;
  jobId: string;
  queueRecordId: string; // ApplyQueue document ID
  artifactState?: ArtifactState; // Passed from Discovery workflow
}

/**
 * Create the Apply Queue
 */
export const applyQueue = new Queue<ApplyJobData>("apply-jobs", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // 1 initial + 2 retries
    backoff: {
      type: "exponential",
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 86400 * 7, // Keep failed jobs for 7 days
    },
  },
});

/**
 * Add a job to the Apply Queue
 */
export async function enqueueApplyJob(data: ApplyJobData) {
  const job = await applyQueue.add("apply-to-job", data, {
    jobId: data.queueRecordId, // Use queueRecordId as BullMQ job ID for idempotency
  });

  return job;
}

/**
 * Get queue metrics
 */
export async function getApplyQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    applyQueue.getWaitingCount(),
    applyQueue.getActiveCount(),
    applyQueue.getCompletedCount(),
    applyQueue.getFailedCount(),
    applyQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}
