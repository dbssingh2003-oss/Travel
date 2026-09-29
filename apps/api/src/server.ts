import { buildApp } from "./app";
import { config, configWarnings } from "./lib/config";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";
import { initSocketGateway } from "./ws/gateway";
import { startOpsWorker } from "./jobs/ops-queue";
import { startNotificationWorker } from "./jobs/notification-queue";

async function bootstrap() {
  // Log any non-fatal configuration warnings
  if (configWarnings.length > 0) {
    configWarnings.forEach((warning) => logger.warn(`[Config Warning] ${warning}`));
  }

  const app = await buildApp();

  // ── Attach Socket.io to Fastify HTTP server ──────────────────────────────
  initSocketGateway(app.server, config.allowedOrigins);

  // ── BullMQ Workers ────────────────────────────────────────────────────────
  try {
    startOpsWorker();
    startNotificationWorker();
  } catch (err: any) {
    logger.warn({ err: err.message }, "[BullMQ] Worker startup deferred");
  }

  // ── Connect Redis ─────────────────────────────────────────────────────────
  try {
    await redis.connect();
  } catch (err: any) {
    logger.warn({ err: err.message }, `[Redis] Note: Redis server not reachable. In-memory / direct fallback active.`);
  }

  // ── Start listening ───────────────────────────────────────────────────────
  await app.listen({ port: config.port, host: config.host });
  logger.info(`🚀 DB Best Worlds API running on http://${config.host}:${config.port}`);
  logger.info(`   WebSocket on ws://${config.host}:${config.port}/ws`);
  logger.info(`   Health check: http://${config.host}:${config.port}/health`);
}

// ── Global Exception & Rejection Handlers ────────────────────────────────────
process.on("unhandledRejection", (reason: any) => {
  logger.error({ err: reason }, "Unhandled Rejection detected in process");
});

process.on("uncaughtException", (error: Error) => {
  logger.fatal({ err: error }, "Uncaught Exception! Server shutting down...");
  process.exit(1);
});

// ── Graceful Shutdown ────────────────────────────────────────────────────────
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  try {
    await prisma.$disconnect();
    if (redis.status === "ready") {
      await redis.quit();
    }
    logger.info("Graceful shutdown completed. Exiting.");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during graceful shutdown");
    process.exit(1);
  }
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

bootstrap().catch((err) => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
