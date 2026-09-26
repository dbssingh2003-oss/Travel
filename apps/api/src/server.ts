import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { config, configWarnings } from "./lib/config";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";
import { errorHandler } from "./middleware/errorHandler";
import { requestIdMiddleware } from "./middleware/requestId";
import { sendSuccess } from "./lib/apiResponse";
import { authRoutes } from "./modules/auth/auth.controller";
import { tripRoutes } from "./modules/trips/trips.controller";
import { legRoutes } from "./modules/trips/legs/legs.controller";
import { bookingRoutes } from "./modules/bookings/bookings.controller";
import { vendorRoutes } from "./modules/vendors/vendors.controller";
import { opsRoutes } from "./modules/ops/ops.controller";
import { paymentRoutes } from "./modules/payments/payments.controller";
import { initSocketGateway } from "./ws/gateway";
import { startOpsWorker } from "./jobs/ops-queue";
import { startNotificationWorker } from "./jobs/notification-queue";

async function bootstrap() {
  // Log any non-fatal configuration warnings
  if (configWarnings.length > 0) {
    configWarnings.forEach((warning) => logger.warn(`[Config Warning] ${warning}`));
  }

  const app = Fastify({
    logger: false, // We use custom structured logger
    trustProxy: true,
    bodyLimit: 2 * 1024 * 1024, // 2MB limit
  });

  // ── Request ID & Traceability ──────────────────────────────────────────────
  app.addHook("onRequest", requestIdMiddleware);

  // ── Security Headers ───────────────────────────────────────────────────────
  app.addHook("onSend", async (_request, reply) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("X-XSS-Protection", "1; mode=block");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    if (config.isProd) {
      reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
  });

  // ── Plugins ───────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: config.allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  });

  await app.register(jwt, {
    secret: config.jwt.accessSecret,
  });

  await app.register(rateLimit, {
    max: config.rateLimit.global.max,
    timeWindow: config.rateLimit.global.window,
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please slow down and try again shortly.",
      },
    }),
  });

  // ── Global Error Handler ──────────────────────────────────────────────────
  app.setErrorHandler(errorHandler);

  // ── Health Check ──────────────────────────────────────────────────────────
  const healthCheck = async (_req: any, reply: any) => {
    let dbStatus = "healthy";
    let redisStatus = "healthy";

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = `unhealthy (${err.message})`;
    }

    try {
      if (redis.status === "ready") {
        await redis.ping();
      } else {
        redisStatus = `status: ${redis.status}`;
      }
    } catch (err: any) {
      redisStatus = `unhealthy (${err.message})`;
    }

    const isHealthy = dbStatus === "healthy";
    const status = isHealthy ? 200 : 503;

    return reply.status(status).send({
      success: isHealthy,
      data: {
        status: isHealthy ? "operational" : "degraded",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        services: {
          database: dbStatus,
          redis: redisStatus,
        },
      },
    });
  };

  app.get("/health", healthCheck);
  app.get("/api/v1/health", healthCheck);

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(authRoutes,    { prefix: "/api/v1/auth" });
  await app.register(tripRoutes,    { prefix: "/api/v1/trips" });
  await app.register(legRoutes,     { prefix: "/api/v1/trips" });
  await app.register(bookingRoutes, { prefix: "/api/v1/bookings" });
  await app.register(vendorRoutes,  { prefix: "/api/v1/vendors" });
  await app.register(opsRoutes,     { prefix: "/api/v1/ops" });
  await app.register(paymentRoutes, { prefix: "/api/v1/payments" });

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
