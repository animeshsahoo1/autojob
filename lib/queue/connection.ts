/**
 * Redis Connection for BullMQ
 *
 * Supports both local Redis and Upstash Redis
 */

import { ConnectionOptions } from "bullmq";

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "cuddly-tahr-12767.upstash.io",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password:
    process.env.REDIS_PASSWORD ||
    process.env.REDIS_REST_TOKEN?.replace(/"/g, ""),
  tls: process.env.REDIS_HOST?.includes("upstash.io") ? {} : undefined, // Enable TLS for Upstash
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: false,
};
