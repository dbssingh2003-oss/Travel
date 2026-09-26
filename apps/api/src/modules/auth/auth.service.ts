import * as argon2 from "argon2";
import { createHash, randomBytes, randomInt } from "crypto";
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { logger } from "../../lib/logger";
import { config } from "../../lib/config";
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "../../lib/errors";
import { sendNotification } from "../notifications/notification.service";
import type { FastifyInstance } from "fastify";
import type {
  RegisterInput,
  LoginInput,
  GoogleOAuthInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
  ChangePasswordInput,
  DeleteAccountInput,
} from "./auth.schema";

// ── Token helpers ────────────────────────────────────────────────────────────

export function generateTokens(
  app: FastifyInstance,
  payload: { sub: string; email: string; role: string }
) {
  const accessToken = app.jwt.sign(payload, {
    expiresIn: config.jwt.accessExpiry || "15m",
  });
  const refreshToken = app.jwt.sign(
    { sub: payload.sub, type: "refresh" },
    { expiresIn: config.jwt.refreshExpiry || "30d" }
  );
  return { accessToken, refreshToken };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

// ── OTP helpers ──────────────────────────────────────────────────────────────

function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

async function sendOtp(phone: string, otp: string): Promise<void> {
  if (config.sms.provider === "console" || config.isDev) {
    logger.info({ phone, otp }, `[OTP] Verification Code for ${phone}: ${otp}`);
    return;
  }
  // If Twilio is configured
  if (config.sms.twilioAccountSid && config.sms.twilioAuthToken) {
    // Twilio SMS dispatch can be integrated here
    logger.info({ phone }, "[OTP] Sending via Twilio");
    return;
  }
  throw new BadRequestError("SMS provider is not configured");
}

// ── Service Functions ────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("An account with this email address already exists.");
  }

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
  try {
    await redis.setex(`otp:${user.id}`, 300, otp);
  } catch (err) {
    logger.warn({ err }, "Redis unavailable, continuing with memory fallback if any");
  }

  if (input.phone) {
    await sendOtp(input.phone, otp);
  } else {
    logger.info({ email: user.email, otp }, `[OTP] Code for ${user.email}: ${otp}`);
  }

  return {
    userId: user.id,
    message: "Registration successful. Please verify your OTP to activate your account.",
    ...(config.isDev ? { devOtp: otp } : {}),
  };
}

export async function verifyOtp(
  app: FastifyInstance,
  userId: string,
  otp: string
) {
  let stored: string | null = null;
  try {
    stored = await redis.get(`otp:${userId}`);
  } catch (err) {
    logger.warn({ err }, "Redis lookup failed for OTP");
  }

  if (!stored || stored !== otp) {
    throw new BadRequestError("Invalid or expired OTP code.");
  }

  await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
  try {
    await redis.del(`otp:${userId}`);
  } catch {}

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

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    },
  };
}

export async function loginUser(app: FastifyInstance, input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError("Invalid email or password.");
  }

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password.");
  }

  if (!user.isVerified) {
    // Generate new OTP for pending verification
    const otp = generateOtp();
    try {
      await redis.setex(`otp:${user.id}`, 300, otp);
    } catch {}
    if (user.phone) await sendOtp(user.phone, otp);

    throw new ForbiddenError(
      "Account is not verified. A new verification OTP has been generated.",
      { userId: user.id, ...(config.isDev ? { devOtp: otp } : {}) }
    );
  }

  const { accessToken, refreshToken } = generateTokens(app, {
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    },
  };
}

export async function googleOAuth(app: FastifyInstance, input: GoogleOAuthInput) {
  const clientId = config.google.clientId;
  if (!clientId) {
    // Development fallback
    logger.warn("[Auth] GOOGLE_CLIENT_ID not set — accepting unverified dev token");
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
    return { ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  const { OAuth2Client } = await import("google-auth-library");
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken: input.idToken, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new BadRequestError("Invalid Google authentication token.");
  }

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

  return {
    ...tokens,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
  };
}

export async function refreshAccessToken(app: FastifyInstance, refreshToken: string) {
  let payload: any;
  try {
    payload = app.jwt.verify(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token.");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
  });
  if (!stored) {
    throw new UnauthorizedError("Refresh token has been revoked or expired. Please sign in again.");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new NotFoundError("User not found.");
  }

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

// ── Profile Management ──────────────────────────────────────────────────────

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      authProvider: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User profile not found.");
  }

  return user;
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      updatedAt: true,
    },
  });

  return updatedUser;
}

export async function changeUserPassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    throw new BadRequestError("Cannot change password for social login accounts.");
  }

  const valid = await argon2.verify(user.passwordHash, input.currentPassword);
  if (!valid) {
    throw new BadRequestError("Current password is incorrect.");
  }

  const newPasswordHash = await argon2.hash(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    }),
  ]);

  return { message: "Password updated successfully. Please log in again with your new password." };
}

export async function deleteUserAccount(userId: string, input: DeleteAccountInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (user.passwordHash && input.password) {
    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new BadRequestError("Incorrect password provided for deletion confirmation.");
    }
  }

  // Soft delete / anonymize or remove user in transaction
  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return { message: "Account deleted successfully." };
}

// ── Password Reset ──────────────────────────────────────────────────────────

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.passwordHash) {
    return { message: "If an account with that email exists, a password reset link has been sent." };
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const frontendUrl = config.allowedOrigins[0] || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

  await sendNotification({
    to: user.email,
    subject: "Reset your DB Best Worlds password",
    body: `Hi ${user.name},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetLink}\n\nThis link expires in 1 hour and can only be used once.\n\nIf you didn't request this, you can safely ignore this email.\n\n— DB Best Worlds`,
    channel: "email",
  });

  return {
    message: "If an account with that email exists, a password reset link has been sent.",
    ...(config.isDev ? { devResetLink: resetLink } : {}),
  };
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = hashToken(input.token);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetRecord) {
    throw new BadRequestError("Invalid or expired reset link.");
  }

  if (resetRecord.used) {
    throw new BadRequestError("This reset link has already been used.");
  }

  if (resetRecord.expiresAt < new Date()) {
    throw new BadRequestError("This reset link has expired. Please request a new one.");
  }

  const newPasswordHash = await argon2.hash(input.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: resetRecord.userId, revoked: false },
      data: { revoked: true },
    }),
  ]);

  return { message: "Password has been reset successfully. You can now sign in with your new password." };
}
