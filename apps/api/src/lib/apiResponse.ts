/**
 * Unified API Response Helpers
 *
 * Every API response follows this envelope:
 *
 *   Success: { success: true,  data: T, message?: string, meta?: object }
 *   Error:   { success: false, error: { code, message, details? } }
 */

import type { FastifyReply } from "fastify";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  field?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Send a success response (HTTP 200 by default or custom status).
 */
export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  messageOrStatus?: string | number,
  statusOrMeta?: number | Record<string, unknown>,
  maybeMeta?: Record<string, unknown>
): FastifyReply {
  let status = 200;
  let message: string | undefined;
  let meta: Record<string, unknown> | undefined;

  if (typeof messageOrStatus === "number") {
    status = messageOrStatus;
    if (typeof statusOrMeta === "object") meta = statusOrMeta;
  } else if (typeof messageOrStatus === "string") {
    message = messageOrStatus;
    if (typeof statusOrMeta === "number") {
      status = statusOrMeta;
      meta = maybeMeta;
    } else if (typeof statusOrMeta === "object") {
      meta = statusOrMeta;
    }
  }

  const body: ApiSuccessResponse<T> = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;

  return reply.status(status).send(body);
}

/**
 * Send a created response (HTTP 201).
 */
export function sendCreated<T>(
  reply: FastifyReply,
  data: T,
  message?: string,
  meta?: Record<string, unknown>
): FastifyReply {
  return sendSuccess(reply, data, message, 201, meta);
}

/**
 * Send a no-content response (HTTP 204).
 */
export function sendNoContent(reply: FastifyReply): FastifyReply {
  return reply.status(204).send();
}

/**
 * Send an error response.
 */
export function sendError(
  reply: FastifyReply,
  status: number,
  message: string,
  code = "REQUEST_FAILED",
  details?: unknown
): FastifyReply {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return reply.status(status).send(body);
}

// ── Common Error Codes ──────────────────────────────────────────────────────

export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  ACCOUNT_NOT_VERIFIED: "ACCOUNT_NOT_VERIFIED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  RECORD_CONFLICT: "RECORD_CONFLICT",
  RECORD_NOT_FOUND: "RECORD_NOT_FOUND",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
