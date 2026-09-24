import * as argon2 from "argon2";
import { createHash, randomBytes, randomInt } from "crypto";
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { sendNotification } from "../notifications/notification.service";
import type { FastifyInstance } from "fastify";
import type { RegisterInput, LoginInput, GoogleOAuthInput, ForgotPasswordInput, ResetPasswordInput } from "./auth.schema";

// ── Token helpers ────────────────────────────────────────────────────────────

export function generateTokens(
  app: FastifyInstance,
  payload: { sub: string; email: string; role: string }
) {
  const accessToken = app.jwt.sign(payload, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
  });
  const refreshToken = app.jwt.sign(
    { sub: payload.sub, type: "refresh" },
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || "30d" }
  );
  return { accessToken, refreshToken };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ── OTP helpers ──────────────────────────────────────────────────────────────

function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

async function sendOtp(phone: string, otp: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER || "console";
  if (provider === "console") {
    console.log(`[OTP] Phone: ${phone} → OTP: ${otp}`);
    return;
  }
  // TODO: integrate Twilio/MSG91 here using process.env.TWILIO_* vars
  throw new Error("SMS provider not configured");
}

// ── Service ──────────────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw Object.assign(new Error("Email already registered"), { statusCode: 409 });

  const passwordHash = await argon2.hash(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      authProvider: "local",
    },
  });

  // Generate and store OTP in Redis (5 min TTL)
  const otp = generateOtp();
  await redis.setex(`otp:${user.id}`, 300, otp);

  if (input.phone) {
    await sendOtp(input.phone, otp);
  } else {
    console.log(`[OTP] No phone provided, OTP for ${user.email}: ${otp}`);
  }

  return {
    userId: user.id,
    ...(process.env.NODE_ENV === "development" ? { devOtp: otp } : {}),
  };
}

export async function verifyOtp(
  app: FastifyInstance,
  userId: string,
  otp: string
) {
  const stored = await redis.get(`otp:${userId}`);
  if (!stored || stored !== otp)
    throw Object.assign(new Error("Invalid or expired OTP"), { statusCode: 400 });

  await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
  await redis.del(`otp:${userId}`);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const { accessToken, refreshToken } = generateTokens(app, {
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  // Persist refresh token hash
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return { accessToken, refreshToken, user: { id: user.id, name: user.name, role: user.role } };
}

export async function loginUser(app: FastifyInstance, input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash)
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });

  if (!user.isVerified)
    throw Object.assign(new Error("Account not verified. Please verify OTP."), { statusCode: 403 });

  const { accessToken, refreshToken } = generateTokens(app, {
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return { accessToken, refreshToken, user: { id: user.id, name: user.name, role: user.role } };
}

export async function googleOAuth(app: FastifyInstance, input: GoogleOAuthInput) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // Stub for dev: parse payload without verification
    console.warn("[Auth] GOOGLE_CLIENT_ID not set — accepting unverified dev token");
    const [, payload] = input.idToken.split(".");
    const decoded = JSON.parse(Buffer.from(payload || "e30=", "base64").toString());
    const email = decoded.email || "dev@example.com";
    const name = decoded.name || "Dev User";

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { name, email, authProvider: "google", isVerified: true },
      });
    }
    const tokens = generateTokens(app, { sub: user.id, email: user.email, role: user.role });
    return { ...tokens, user: { id: user.id, name: user.name, role: user.role } };
  }

  const { OAuth2Client } = await import("google-auth-library");
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken: input.idToken, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload?.email) throw Object.assign(new Error("Invalid Google token"), { statusCode: 400 });

  let user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: payload.name || payload.email,
        email: payload.email,
        authProvider: "google",
        isVerified: true,
      },
    });
  }

  const tokens = generateTokens(app, { sub: user.id, email: user.email, role: user.role });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(tokens.refreshToken), expiresAt },
  });

  return { ...tokens, user: { id: user.id, name: user.name, role: user.role } };
}

export async function refreshAccessToken(app: FastifyInstance, refreshToken: string) {
  let payload: any;
  try {
    payload = app.jwt.verify(refreshToken);
  } catch {
    throw Object.assign(new Error("Invalid refresh token"), { statusCode: 401 });
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
  });
  if (!stored) throw Object.assign(new Error("Refresh token revoked or expired"), { statusCode: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
  const { accessToken } = generateTokens(app, {
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { accessToken };
}

export async function logoutUser(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
}

// ── Password Reset ──────────────────────────────────────────────────────────

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Request a password reset link.
 * Always returns the same response to prevent email enumeration attacks.
 */
export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.passwordHash) {
    // Don't reveal whether the email exists — return success either way
    return { message: "If an account with that email exists, a password reset link has been sent." };
  }

  // Invalidate any previous unused reset tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  // Generate a cryptographically secure random token
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  // Build the reset link — frontend URL
  const frontendUrl = process.env.ALLOWED_ORIGINS?.split(",")[0] || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

  // Send the email via the notification service
  await sendNotification({
    to: user.email,
    subject: "Reset your DB Best Worlds password",
    body: `Hi ${user.name},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetLink}\n\nThis link expires in 1 hour and can only be used once.\n\nIf you didn't request this, you can safely ignore this email.\n\n— DB Best Worlds`,
    channel: "email",
  });

  // In development, also return the token for easy testing
  return {
    message: "If an account with that email exists, a password reset link has been sent.",
    ...(process.env.NODE_ENV === "development" ? { devResetLink: resetLink } : {}),
  };
}

/**
 * Reset the user's password using a valid, unexpired, unused token.
 */
export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = hashToken(input.token);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetRecord) {
    throw Object.assign(new Error("Invalid or expired reset link"), { statusCode: 400 });
  }

  if (resetRecord.used) {
    throw Object.assign(new Error("This reset link has already been used"), { statusCode: 400 });
  }

  if (resetRecord.expiresAt < new Date()) {
    throw Object.assign(new Error("This reset link has expired"), { statusCode: 400 });
  }

  // Hash the new password with argon2
  const newPasswordHash = await argon2.hash(input.password);

  // Update the user's password and mark the token as used — in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    }),
    // Revoke all existing refresh tokens for the user (force re-login everywhere)
    prisma.refreshToken.updateMany({
      where: { userId: resetRecord.userId, revoked: false },
      data: { revoked: true },
    }),
  ]);

  return { message: "Password has been reset successfully. You can now sign in with your new password." };
}

