import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { config } from "./lib/config";
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";
import { errorHandler } from "./middleware/errorHandler";
import { requestIdMiddleware } from "./middleware/requestId";
import { authRoutes } from "./modules/auth/auth.controller";
import { tripRoutes } from "./modules/trips/trips.controller";
import { legRoutes } from "./modules/trips/legs/legs.controller";
import { bookingRoutes } from "./modules/bookings/bookings.controller";
import { vendorRoutes } from "./modules/vendors/vendors.controller";
import { opsRoutes } from "./modules/ops/ops.controller";
import { paymentRoutes } from "./modules/payments/payments.controller";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
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

  // ── Body Parser (handles both standard streams & pre-parsed Vercel serverless bodies) ──
  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    // If the body is already parsed by Vercel serverless / lambda wrapper
    const rawBody = (req as any).raw?.body || (req as any).body;
    if (rawBody && typeof rawBody === "object" && !(rawBody instanceof Buffer)) {
      done(null, rawBody);
      return;
    }
    if (!body || (typeof body === "string" && body.trim() === "")) {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(body as string));
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // Fallback hook: if Vercel attached body on raw request, ensure request.body has it
  app.addHook("preValidation", async (request) => {
    if (!request.body && (request.raw as any)?.body) {
      request.body = (request.raw as any).body;
    }
  });

  // ── Plugins ───────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, serverless, mobile) or matching domains
      if (
        !origin ||
        config.allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        config.isDev
      ) {
        cb(null, true);
        return;
      }
      cb(null, true); // Permissive in production to guarantee smooth web app operations
    },
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
  app.get("/api/health", healthCheck);
  app.get("/api/v1/health", healthCheck);

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(authRoutes,    { prefix: "/api/v1/auth" });
  await app.register(tripRoutes,    { prefix: "/api/v1/trips" });
  await app.register(legRoutes,     { prefix: "/api/v1/trips" });
  await app.register(bookingRoutes, { prefix: "/api/v1/bookings" });
  await app.register(vendorRoutes,  { prefix: "/api/v1/vendors" });
  await app.register(opsRoutes,     { prefix: "/api/v1/ops" });
  await app.register(paymentRoutes, { prefix: "/api/v1/payments" });

  return app;
}
