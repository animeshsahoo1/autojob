/**
 * BullMQ Queue for Discovery Workflow
 *
 * Jobs are enqueued when user starts workflow from dashboard
 * Workers process the discovery workflow and can be stopped via kill switch
 */

import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export interface DiscoveryJobData {
  agentRunId: string;
  userId: string;
}

/**
 * Create the Discovery Queue
 */
export const discoveryQueue = new Queue<DiscoveryJobData>("discovery-jobs", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1, // No retries for discovery - user can restart manually
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 100,
    },
    removeOnFail: {
      age: 86400 * 7, // Keep failed jobs for 7 days
    },
  },
});

/**
 * Add a job to the Discovery Queue
 */
export async function enqueueDiscoveryJob(data: DiscoveryJobData) {
  const job = await discoveryQueue.add("run-discovery", data, {
    jobId: data.agentRunId, // Use agentRunId as BullMQ job ID for idempotency
  });

  return job;
}
