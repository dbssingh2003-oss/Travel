import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";
import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./modules/auth/auth.controller";
import { tripRoutes } from "./modules/trips/trips.controller";
import { bookingRoutes } from "./modules/bookings/bookings.controller";
import { vendorRoutes } from "./modules/vendors/vendors.controller";
import { opsRoutes } from "./modules/ops/ops.controller";
import { initSocketGateway } from "./ws/gateway";
import { startOpsWorker } from "./jobs/ops-queue";
import { startNotificationWorker } from "./jobs/notification-queue";

const PORT = parseInt(process.env.PORT || "4000");
const HOST = "0.0.0.0";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");

async function bootstrap() {
  const app = Fastify({
    logger: process.env.NODE_ENV === "development",
    trustProxy: true,
  });

  // ── Plugins ───────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET || "dev-secret-change-me-in-production",
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // ── Error handler ─────────────────────────────────────────────────────────
  app.setErrorHandler(errorHandler);

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(authRoutes,    { prefix: "/api/v1/auth" });
  await app.register(tripRoutes,    { prefix: "/api/v1/trips" });
  await app.register(bookingRoutes, { prefix: "/api/v1/bookings" });
  await app.register(vendorRoutes,  { prefix: "/api/v1/vendors" });
  await app.register(opsRoutes,     { prefix: "/api/v1/ops" });

  // ── Health check ──────────────────────────────────────────────────────────
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // ── Attach Socket.io to Fastify HTTP server ──────────────────────────────
  initSocketGateway(app.server, ALLOWED_ORIGINS);

  // ── BullMQ Workers ────────────────────────────────────────────────────────
  try {
    startOpsWorker();
    startNotificationWorker();
  } catch (err: any) {
    console.warn("[BullMQ] Worker startup deferred:", err.message);
  }

  // ── Connect Redis ─────────────────────────────────────────────────────────
  try {
    await redis.connect();
  } catch (err: any) {
    console.warn(`[Redis] Note: Redis server not reachable (${err.message}). In-memory / direct processing active.`);
  }

  // ── Start listening ───────────────────────────────────────────────────────
  await app.listen({ port: PORT, host: HOST });
  console.log(`\n🚀 DB Best Worlds API running on http://localhost:${PORT}`);
  console.log(`   WebSocket on ws://localhost:${PORT}/ws`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});
