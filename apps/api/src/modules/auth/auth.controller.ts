import type { FastifyInstance } from "fastify";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth.middleware";
import { sendSuccess, sendCreated, sendNoContent } from "../../lib/apiResponse";
import {
  RegisterSchema,
  VerifyOtpSchema,
  LoginSchema,
  GoogleOAuthSchema,
  RefreshSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
  DeleteAccountSchema,
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
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
  deleteUserAccount,
} from "./auth.service";

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post("/register", { preHandler: validate(RegisterSchema) }, async (req, reply) => {
    const result = await registerUser((req as any).validated);
    return sendCreated(reply, result, "Registration initiated. Please verify OTP.");
  });

  // POST /auth/verify-otp
  app.post("/verify-otp", { preHandler: validate(VerifyOtpSchema) }, async (req, reply) => {
    const { userId, otp } = (req as any).validated;
    const result = await verifyOtp(app, userId, otp);
    return sendSuccess(reply, result, "Account verified successfully.");
  });

  // POST /auth/login
  app.post("/login", { preHandler: validate(LoginSchema) }, async (req, reply) => {
    const result = await loginUser(app, (req as any).validated);
    return sendSuccess(reply, result, "Login successful.");
  });

  // POST /auth/oauth/google
  app.post("/oauth/google", { preHandler: validate(GoogleOAuthSchema) }, async (req, reply) => {
    const result = await googleOAuth(app, (req as any).validated);
    return sendSuccess(reply, result, "Google authentication successful.");
  });

  // POST /auth/refresh
  app.post("/refresh", { preHandler: validate(RefreshSchema) }, async (req, reply) => {
    const { refreshToken } = (req as any).validated;
    const result = await refreshAccessToken(app, refreshToken);
    return sendSuccess(reply, result);
  });

  // POST /auth/forgot-password
  app.post("/forgot-password", { preHandler: validate(ForgotPasswordSchema) }, async (req, reply) => {
    const result = await requestPasswordReset((req as any).validated);
    return sendSuccess(reply, result);
  });

  // POST /auth/reset-password
  app.post("/reset-password", { preHandler: validate(ResetPasswordSchema) }, async (req, reply) => {
    const result = await resetPassword((req as any).validated);
    return sendSuccess(reply, result);
  });

  // GET /auth/me
  app.get("/me", { preHandler: [requireAuth()] }, async (req, reply) => {
    const userId = (req.user as any).sub;
    const user = await getCurrentUser(userId);
    return sendSuccess(reply, user);
  });

  // PATCH /auth/profile
  app.patch("/profile", { preHandler: [requireAuth(), validate(UpdateProfileSchema)] }, async (req, reply) => {
    const userId = (req.user as any).sub;
    const updated = await updateUserProfile(userId, (req as any).validated);
    return sendSuccess(reply, updated, "Profile updated successfully.");
  });

  // POST /auth/change-password
  app.post("/change-password", { preHandler: [requireAuth(), validate(ChangePasswordSchema)] }, async (req, reply) => {
    const userId = (req.user as any).sub;
    const result = await changeUserPassword(userId, (req as any).validated);
    return sendSuccess(reply, result);
  });

  // DELETE /auth/account
  app.delete("/account", { preHandler: [requireAuth(), validate(DeleteAccountSchema)] }, async (req, reply) => {
    const userId = (req.user as any).sub;
    const result = await deleteUserAccount(userId, (req as any).validated);
    return sendSuccess(reply, result);
  });

  // POST /auth/logout
  app.post(
    "/logout",
    { preHandler: [requireAuth()] },
    async (req, reply) => {
      const body = req.body as { refreshToken?: string };
      if (body?.refreshToken) await logoutUser(body.refreshToken);
      return sendNoContent(reply);
    }
  );
}
