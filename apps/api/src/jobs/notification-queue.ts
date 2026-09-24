import { Queue, Worker } from "bullmq";
import { sendNotification } from "../modules/notifications/notification.service";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const urlParts = new URL(redisUrl);

const redisConnection = {
  host: urlParts.hostname,
  port: parseInt(urlParts.port || "6379"),
  password: urlParts.password || undefined,
};

export const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
});

notificationQueue.on("error", (err) => {
  // Gracefully handled in development when Redis is offline
});

export function startNotificationWorker() {
  const worker = new Worker(
    "notifications",
    async (job) => {
      const { to, subject, body, channel } = job.data;
      await sendNotification({ to, subject, body, channel });
    },
    { connection: redisConnection }
  );

  worker.on("error", (err) => {
    // Gracefully handle in dev when Redis is offline
  });

  return worker;
}
