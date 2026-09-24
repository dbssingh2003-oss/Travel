import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number").optional(),
  password: z.string().min(8).max(100),
});

export const VerifyOtpSchema = z.object({
  userId: z.string().uuid(),
  otp: z.string().length(6),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const GoogleOAuthSchema = z.object({
  idToken: z.string(),
});

export const RefreshSchema = z.object({
  refreshToken: z.string(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type GoogleOAuthInput = z.infer<typeof GoogleOAuthSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
