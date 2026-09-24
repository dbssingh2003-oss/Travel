import type { FastifyInstance } from "fastify";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  RegisterSchema,
  VerifyOtpSchema,
  LoginSchema,
  GoogleOAuthSchema,
  RefreshSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "./auth.schema";
import {
  registerUser,
  verifyOtp,
  loginUser,
  googleOAuth,
  refreshAccessToken,
  logoutUser,
  requestPasswordReset,
  resetPassword,
} from "./auth.service";

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post("/register", { preHandler: validate(RegisterSchema) }, async (req, reply) => {
    const result = await registerUser((req as any).validated);
    return reply.status(201).send({ ...result, message: "OTP sent to phone for verification" });
  });

  // POST /auth/verify-otp
  app.post("/verify-otp", { preHandler: validate(VerifyOtpSchema) }, async (req, reply) => {
    const { userId, otp } = (req as any).validated;
    const result = await verifyOtp(app, userId, otp);
    return reply.send(result);
  });

  // POST /auth/login
  app.post("/login", { preHandler: validate(LoginSchema) }, async (req, reply) => {
    const result = await loginUser(app, (req as any).validated);
    return reply.send(result);
  });

  // POST /auth/oauth/google
  app.post("/oauth/google", { preHandler: validate(GoogleOAuthSchema) }, async (req, reply) => {
    const result = await googleOAuth(app, (req as any).validated);
    return reply.send(result);
  });

  // POST /auth/refresh
  app.post("/refresh", { preHandler: validate(RefreshSchema) }, async (req, reply) => {
    const { refreshToken } = (req as any).validated;
    const result = await refreshAccessToken(app, refreshToken);
    return reply.send(result);
  });

  // POST /auth/forgot-password
  app.post("/forgot-password", { preHandler: validate(ForgotPasswordSchema) }, async (req, reply) => {
    const result = await requestPasswordReset((req as any).validated);
    return reply.send(result);
  });

  // POST /auth/reset-password
  app.post("/reset-password", { preHandler: validate(ResetPasswordSchema) }, async (req, reply) => {
    const result = await resetPassword((req as any).validated);
    return reply.send(result);
  });

  // POST /auth/logout
  app.post(
    "/logout",
    { preHandler: [requireAuth()] },
    async (req, reply) => {
      const body = req.body as { refreshToken?: string };
      if (body?.refreshToken) await logoutUser(body.refreshToken);
      return reply.status(204).send();
    }
  );
}

