import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/apiService";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      const res = await authApi.forgotPassword(data);
      setSubmitted(true);
      if (res.devResetLink) {
        setDevLink(res.devResetLink);
      }
    } catch {
      // Even on error, show success to prevent email enumeration
      setSubmitted(true);
    }
  };

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
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-muted text-sm mt-1">
            We'll send you a link to reset your password
          </p>
        </div>

        <div className="glass-card p-8">
          {!submitted ? (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  <Mail className="w-3.5 h-3.5 inline mr-1" /> Email Address
                </label>
                <input
                  {...form.register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="input-field"
                  autoFocus
                  id="forgot-password-email"
                />
                {form.formState.errors.email && (
                  <p className="text-danger text-xs mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {form.formState.errors.root && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                  {form.formState.errors.root.message}
                </div>
              )}

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="btn-primary w-full"
                id="forgot-password-submit"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <Link
                to="/auth"
                className="flex items-center justify-center gap-1.5 text-sm text-muted hover:text-slate-300 transition-colors mt-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
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
                Check your email
              </h3>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                If an account with that email exists, we've sent a password
                reset link. Please check your inbox and spam folder.
              </p>
              <p className="text-xs text-muted mb-6">
                The link expires in 1 hour.
              </p>

              {devLink && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-left mb-4">
                  <p className="text-warning text-xs font-semibold mb-1">
                    🛠 Dev Mode — Reset Link:
                  </p>
                  <a
                    href={devLink}
                    className="text-xs text-accent break-all hover:underline"
                  >
                    {devLink}
                  </a>
                </div>
              )}

              <Link to="/auth" className="btn-secondary w-full inline-flex">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
