/**
 * Structured Logger
 *
 * Production: JSON lines for log aggregation
 * Development: Human-readable colored output
 *
 * Never logs sensitive data (passwords, tokens, secrets).
 * Supports both log(message, context) and log(context, message) signatures.
 */

import { config } from "./config";

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: unknown;
}

// Fields that should never appear in logs
const SENSITIVE_FIELDS = new Set([
  "password",
  "passwordhash",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "authorization",
  "cookie",
  "otp",
  "idtoken",
  "apikey",
  "creditcard",
]);

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      clean[key] = sanitize(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const MIN_LEVEL: LogLevel = config.isDev ? "debug" : "info";

const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  fatal: "\x1b[35m",
};
const RESET = "\x1b[0m";

function normalizeLogArgs(
  arg1: string | Record<string, unknown>,
  arg2?: string | Record<string, unknown>
): { message: string; context?: LogContext } {
  if (typeof arg1 === "string") {
    return {
      message: arg1,
      context: typeof arg2 === "object" && arg2 !== null ? (arg2 as LogContext) : undefined,
    };
  }
  if (typeof arg1 === "object" && arg1 !== null) {
    return {
      message: typeof arg2 === "string" ? arg2 : JSON.stringify(sanitize(arg1)),
      context: arg1 as LogContext,
    };
  }
  return { message: String(arg1) };
}

function formatDev(level: LogLevel, message: string, context?: LogContext): string {
  const color = COLORS[level];
  const time = new Date().toLocaleTimeString();
  const prefix = context?.requestId ? ` [${context.requestId.slice(0, 8)}]` : "";
  const extra = context
    ? " " +
      Object.entries(sanitize(context))
        .filter(([k]) => k !== "requestId")
        .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join(" ")
    : "";
  return `${color}[${time}] ${level.toUpperCase().padEnd(5)}${RESET}${prefix} ${message}${extra}`;
}

function formatProd(level: LogLevel, message: string, context?: LogContext): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? sanitize(context) : {}),
  });
}

function log(level: LogLevel, arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[MIN_LEVEL]) return;

  const { message, context } = normalizeLogArgs(arg1, arg2);

  const formatted = config.isDev
    ? formatDev(level, message, context)
    : formatProd(level, message, context);

  if (level === "error" || level === "fatal") {
    console.error(formatted);
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  debug: (arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>) =>
    log("debug", arg1, arg2),
  info: (arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>) =>
    log("info", arg1, arg2),
  warn: (arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>) =>
    log("warn", arg1, arg2),
  error: (arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>) =>
    log("error", arg1, arg2),
  fatal: (arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>) =>
    log("fatal", arg1, arg2),

  child(baseContext: LogContext) {
    return {
      debug: (arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>) => {
        const { message, context } = normalizeLogArgs(arg1, arg2);
        log("debug", message, { ...baseContext, ...context });
      },
      info: (arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>) => {
        const { message, context } = normalizeLogArgs(arg1, arg2);
        log("info", message, { ...baseContext, ...context });
      },
      warn: (arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>) => {
        const { message, context } = normalizeLogArgs(arg1, arg2);
        log("warn", message, { ...baseContext, ...context });
      },
      error: (arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>) => {
        const { message, context } = normalizeLogArgs(arg1, arg2);
        log("error", message, { ...baseContext, ...context });
      },
      fatal: (arg1: string | Record<string, unknown>, arg2?: string | Record<string, unknown>) => {
        const { message, context } = normalizeLogArgs(arg1, arg2);
        log("fatal", message, { ...baseContext, ...context });
      },
    };
  },
};
