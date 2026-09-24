import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../lib/errors";
import { sendError } from "../lib/apiResponse";
import { logger } from "../lib/logger";
import { config } from "../lib/config";
import { ZodError } from "zod";

/**
 * Global Error Handler for Fastify
 *
 * Handles:
 * - AppError subclasses (BadRequestError, NotFoundError, UnauthorizedError, etc.)
 * - Zod validation errors
 * - Prisma database errors (P2002 unique, P2025 not found, P2003 foreign key)
 * - JWT authentication errors
 * - Standard Fastify / JS Errors
 */
export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const reqId = request.id || "unknown";
  const reqLog = logger.child({ reqId, method: request.method, url: request.url });

  // 1. AppError (operational application errors)
  if (error instanceof AppError) {
    reqLog.warn(
      { code: error.code, statusCode: error.statusCode, details: error.details },
      `Operational error: ${error.message}`
    );
    return sendError(
      reply,
      error.statusCode,
      error.message,
      error.code,
      error.details
    );
  }

  // 2. Zod validation error
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    reqLog.warn({ issues }, "Validation error");
    return sendError(
      reply,
      400,
      "Validation failed. Please check your input.",
      "VALIDATION_ERROR",
      issues
    );
  }

  // 3. Fastify Schema Validation Error
  if ("validation" in error && Array.isArray((error as any).validation)) {
    const details = (error as any).validation;
    reqLog.warn({ details }, "Fastify schema validation error");
    return sendError(
      reply,
      400,
      error.message || "Invalid request payload",
      "VALIDATION_ERROR",
      details
    );
  }

  // 4. Prisma known errors
  const errCode = (error as any).code;
  if (typeof errCode === "string" && errCode.startsWith("P")) {
    if (errCode === "P2002") {
      const target = (error as any).meta?.target;
      const field = Array.isArray(target) ? target.join(", ") : target || "field";
      reqLog.warn({ errCode, field }, "Prisma unique constraint violation");
      return sendError(
        reply,
        409,
        `A record with this ${field} already exists.`,
        "RECORD_CONFLICT",
        { field }
      );
    }
    if (errCode === "P2025") {
      reqLog.warn({ errCode }, "Prisma record not found");
      return sendError(
        reply,
        404,
        "The requested record was not found.",
        "RECORD_NOT_FOUND"
      );
    }
    if (errCode === "P2003") {
      reqLog.warn({ errCode }, "Prisma foreign key constraint violation");
      return sendError(
        reply,
        400,
        "Referenced record does not exist.",
        "INVALID_RELATION"
      );
    }
    if (errCode === "P1001" || errCode === "P1002") {
      reqLog.error({ errCode }, "Database connection error");
      return sendError(
        reply,
        503,
        "Database is temporarily reconnecting. Please retry in a moment.",
        "DATABASE_UNAVAILABLE"
      );
    }
  }

  // 5. JWT errors
  if (error.name === "JsonWebTokenError") {
    reqLog.warn({ error: error.message }, "Invalid JWT token");
    return sendError(
      reply,
      401,
      "Invalid authentication token.",
      "INVALID_TOKEN"
    );
  }
  if (error.name === "TokenExpiredError") {
    reqLog.warn("JWT token expired");
    return sendError(
      reply,
      401,
      "Authentication token has expired. Please log in again.",
      "TOKEN_EXPIRED"
    );
  }

  // 6. Generic / Internal Server Errors
  const statusCode = (error as any).statusCode || 500;
  reqLog.error(
    { err: error, stack: error.stack },
    `Unhandled error: ${error.message}`
  );

  const message =
    statusCode >= 500 && config.isProd
      ? "An unexpected internal server error occurred."
      : error.message || "Internal server error";

  return sendError(
    reply,
    statusCode,
    message,
    statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED",
    config.isDev ? { stack: error.stack } : undefined
  );
}
