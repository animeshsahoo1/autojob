/**
 * Redis Connection for BullMQ
 *
 * Supports both local Redis and Upstash Redis
 */

import { Redis } from "ioredis";
import { ConnectionOptions } from "bullmq";

// For Upstash Redis - use direct TCP connection with proper config
const isUpstash =
  !process.env.REDIS_HOST || process.env.REDIS_HOST.includes("upstash.io");

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "cuddly-tahr-12767.upstash.io",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password:
    process.env.REDIS_PASSWORD ||
    process.env.REDIS_REST_TOKEN?.replace(/"/g, ""),
  ...(isUpstash && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  connectTimeout: 30000,
  lazyConnect: false,
  keepAlive: 30000,
  retryStrategy(times: number) {
    if (times > 3) {
      console.log(`[Redis] Max retries reached`);
      return null;
    }
    const delay = Math.min(times * 3000, 10000);
    console.log(`[Redis] Retry attempt ${times}/${3}, waiting ${delay}ms`);
    return delay;
  },
};
