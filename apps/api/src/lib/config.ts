/**
 * Centralized Configuration & Environment Validation
 *
 * All environment variables are validated at startup.
 * The server will refuse to start if critical variables are missing.
 * Import `config` anywhere instead of reading process.env directly.
 */
import "dotenv/config";

// ── Helpers ──────────────────────────────────────────────────────────────────

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[Config] Missing required environment variable: ${key}. ` +
        `Set it in your .env file or system environment.`
    );
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`[Config] Invalid integer for ${key}: "${raw}"`);
  }
  return parsed;
}

// ── Validate & Export ────────────────────────────────────────────────────────

const NODE_ENV = optional("NODE_ENV", "development");
const isDev = NODE_ENV === "development";
const isProd = NODE_ENV === "production";

// In production, enforce strong secrets
function requiredInProd(key: string, devFallback: string): string {
  if (isProd) return required(key);
  return optional(key, devFallback);
}

export const config = Object.freeze({
  // ── App ──────────────────────────────────────────────────────────────────
  nodeEnv: NODE_ENV,
  isDev,
  isProd,
  port: optionalInt("PORT", 4000),
  host: optional("HOST", "0.0.0.0"),

  // ── Database ─────────────────────────────────────────────────────────────
  databaseUrl: required("DATABASE_URL"),

  // ── Redis ────────────────────────────────────────────────────────────────
  redisUrl: optional("REDIS_URL", "redis://localhost:6379"),

  // ── JWT ──────────────────────────────────────────────────────────────────
  jwt: {
    accessSecret: requiredInProd(
      "JWT_ACCESS_SECRET",
      "dev-access-secret-not-for-production-use-min32chars"
    ),
    refreshSecret: requiredInProd(
      "JWT_REFRESH_SECRET",
      "dev-refresh-secret-not-for-production-use-min32chars"
    ),
    accessExpiry: optional("JWT_ACCESS_EXPIRY", "15m"),
    refreshExpiry: optional("JWT_REFRESH_EXPIRY", "30d"),
  },

  // ── OAuth ────────────────────────────────────────────────────────────────
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },

  // ── Payments ─────────────────────────────────────────────────────────────
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },

  // ── SMS / OTP ────────────────────────────────────────────────────────────
  sms: {
    provider: optional("SMS_PROVIDER", "console"),
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
    twilioFromNumber: process.env.TWILIO_FROM_NUMBER || "",
  },

  // ── Email ────────────────────────────────────────────────────────────────
  email: {
    provider: optional("EMAIL_PROVIDER", "console"),
    from: optional("EMAIL_FROM", "noreply@dbbestworlds.app"),
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    awsRegion: optional("AWS_REGION", "ap-south-1"),
  },

  // ── CORS ─────────────────────────────────────────────────────────────────
  allowedOrigins: optional("ALLOWED_ORIGINS", "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // ── Rate Limiting ────────────────────────────────────────────────────────
  rateLimit: {
    global: { max: optionalInt("RATE_LIMIT_GLOBAL_MAX", 100), window: "1 minute" },
    auth: { max: optionalInt("RATE_LIMIT_AUTH_MAX", 10), window: "15 minutes" },
    passwordReset: { max: 3, window: "15 minutes" },
  },
});

// ── Startup validation summary ──────────────────────────────────────────────

const warnings: string[] = [];

if (!config.jwt.accessSecret || config.jwt.accessSecret.length < 32) {
  warnings.push("JWT_ACCESS_SECRET is weak or too short (min 32 chars)");
}
if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 32) {
  warnings.push("JWT_REFRESH_SECRET is weak or too short (min 32 chars)");
}
if (config.jwt.accessSecret === config.jwt.refreshSecret) {
  warnings.push("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET should be different");
}
if (isProd && config.allowedOrigins.includes("http://localhost:5173")) {
  warnings.push("ALLOWED_ORIGINS includes localhost in production");
}

export const configWarnings = warnings;
