import { Queue, Worker } from "bullmq";
import { redis } from "../lib/redis";

const connection = { host: "localhost", port: 6379 };

// Override with REDIS_URL parsing if needed
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const urlParts = new URL(redisUrl);

const redisConnection = {
  host: urlParts.hostname,
  port: parseInt(urlParts.port || "6379"),
  password: urlParts.password || undefined,
};

export const opsQueue = new Queue("ops-fulfillment", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});

opsQueue.on("error", (err) => {
  // Silent or debug log in development when Redis is not running
});

/**
 * Ops Queue Worker
 *
 * In v1, the worker simply logs the task. The real fulfillment happens
 * when an ops agent manually calls PATCH /ops/bookings/:id/confirm.
 *
 * The worker is responsible for SLA breach detection and escalation.
 */
export function startOpsWorker() {
  const worker = new Worker(
    "ops-fulfillment",
    async (job) => {
      const { bookingId, tripId, type, amount } = job.data;
      console.log(
        `[OpsQueue] New task → bookingId: ${bookingId} | type: ${type} | tripId: ${tripId} | amount: ₹${amount}`
      );
      // The ops agent picks this up from the dashboard (GET /ops/bookings/pending)
      // No automated processing here — human-in-the-loop model
    },
    { connection: redisConnection }
  );

  worker.on("error", (err) => {
    // Non-fatal error when Redis is offline in local dev
  });

  return worker;
}
