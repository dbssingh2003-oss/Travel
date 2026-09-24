import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Globe,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { authApi } from "@/lib/apiService";

const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof ResetPasswordSchema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
  ];

  const metCount = checks.filter((c) => c.met).length;
  const strengthPercent = (metCount / checks.length) * 100;
  const strengthColor =
    metCount <= 1
      ? "bg-danger"
      : metCount <= 2
      ? "bg-warning"
      : metCount <= 3
      ? "bg-accent"
      : "bg-success";

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-3 space-y-2"
    >
      <div className="progress-bar">
        <div
          className={`progress-bar-fill !bg-none ${strengthColor}`}
          style={{ width: `${strengthPercent}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((check) => (
          <div
            key={check.label}
            className={`flex items-center gap-1 text-xs transition-colors ${
              check.met ? "text-success" : "text-muted"
            }`}
          >
            {check.met ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-current opacity-50" />
            )}
            {check.label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: "onChange",
  });

  const watchPassword = form.watch("password") || "";

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;
    setApiError(null);
    try {
      await authApi.resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/auth?reset=success"), 3000);
    } catch (err: any) {
      setApiError(err.message || "Something went wrong. Please try again.");
    }
  };

  // No token provided
  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center px-4 pt-20"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-danger/10 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md relative z-10">
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
            <p className="text-sm text-muted mb-6">
              This password reset link is missing a token. Please request a new
              one.
            </p>
            <Link to="/forgot-password" className="btn-primary inline-flex">
              Request New Link
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-4 pt-20"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-glow-primary mx-auto mb-4">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-muted text-sm mt-1">
            Create a strong new password for your account
          </p>
        </div>

        <div className="glass-card p-8">
          {!success ? (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* New Password */}
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  <Lock className="w-3.5 h-3.5 inline mr-1" /> New Password
                </label>
                <div className="relative">
                  <input
                    {...form.register("password")}
                    type={showPass ? "text" : "password"}
                    placeholder="Min 8 characters"
                    className="input-field pr-10"
                    autoFocus
                    id="reset-password-new"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate-200"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-danger text-xs mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
                <PasswordStrength password={watchPassword} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1" /> Confirm
                  Password
                </label>
                <div className="relative">
                  <input
                    {...form.register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    className="input-field pr-10"
                    id="reset-password-confirm"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate-200"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-danger text-xs mt-1">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* API error */}
              {apiError && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="btn-primary w-full"
                id="reset-password-submit"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Resetting…
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                Password Reset!
              </h3>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Your password has been successfully updated. You'll be
                redirected to the sign-in page momentarily.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted">
                <Loader2 className="w-3 h-3 animate-spin" />
                Redirecting to Sign In…
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
