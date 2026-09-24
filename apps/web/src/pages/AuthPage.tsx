import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Mail, Lock, Phone, User, Loader2, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number").optional().or(z.literal("")),
  password: z.string().min(8, "Min 8 characters"),
});

const OtpSchema = z.object({
  otp: z.string().length(6, "OTP is 6 digits"),
});

export default function AuthPage() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<"login" | "register" | "otp">(
    params.get("tab") === "register" ? "register" : "login"
  );
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const { setAuth, accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) navigate("/dashboard");
  }, [accessToken, navigate]);

  const loginForm = useForm({ resolver: zodResolver(LoginSchema) });
  const registerForm = useForm({ resolver: zodResolver(RegisterSchema) });
  const otpForm = useForm({ resolver: zodResolver(OtpSchema) });

  const onLogin = async (data: any) => {
    try {
      const res = await api.post("/auth/login", data);
      setAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
      navigate("/dashboard");
    } catch (err: any) {
      loginForm.setError("root", { message: err.response?.data?.error || "Login failed" });
    }
  };

  const onRegister = async (data: any) => {
    try {
      const res = await api.post("/auth/register", { ...data, phone: data.phone || undefined });
      setPendingUserId(res.data.userId);
      if (res.data.devOtp) {
        otpForm.setValue("otp", res.data.devOtp);
      }
      setTab("otp");
    } catch (err: any) {
      registerForm.setError("root", { message: err.response?.data?.error || "Registration failed" });
    }
  };

  const onVerifyOtp = async (data: any) => {
    try {
      const res = await api.post("/auth/verify-otp", { userId: pendingUserId, otp: data.otp });
      setAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
      navigate("/dashboard");
    } catch (err: any) {
      otpForm.setError("root", { message: err.response?.data?.error || "Invalid OTP" });
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
          <h1 className="text-2xl font-bold">DB Best Worlds</h1>
          <p className="text-muted text-sm mt-1">Your honest travel companion</p>
        </div>

        <div className="glass-card p-8">
          {/* Tabs */}
          {tab !== "otp" && (
            <div className="flex gap-1 p-1 bg-surface-2 rounded-xl mb-6">
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    tab === t
                      ? "bg-primary text-white shadow-glow-primary"
                      : "text-muted hover:text-slate-300"
                  }`}
                >
                  {t === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>
          )}

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  <Mail className="w-3.5 h-3.5 inline mr-1" /> Email
                </label>
                <input {...loginForm.register("email")} type="email" placeholder="you@example.com" className="input-field" />
                {loginForm.formState.errors.email && (
                  <p className="text-danger text-xs mt-1">{loginForm.formState.errors.email.message as string}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  <Lock className="w-3.5 h-3.5 inline mr-1" /> Password
                </label>
                <div className="relative">
                  <input
                    {...loginForm.register("password")}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate-200"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-danger text-xs mt-1">{loginForm.formState.errors.password.message as string}</p>
                )}
              </div>
              {loginForm.formState.errors.root && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                  {loginForm.formState.errors.root.message}
                </div>
              )}
              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="btn-primary w-full"
              >
                {loginForm.formState.isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                ) : "Sign In"}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  <User className="w-3.5 h-3.5 inline mr-1" /> Full Name
                </label>
                <input {...registerForm.register("name")} placeholder="Aditi Sharma" className="input-field" />
                {registerForm.formState.errors.name && (
                  <p className="text-danger text-xs mt-1">{registerForm.formState.errors.name.message as string}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  <Mail className="w-3.5 h-3.5 inline mr-1" /> Email
                </label>
                <input {...registerForm.register("email")} type="email" placeholder="you@example.com" className="input-field" />
                {registerForm.formState.errors.email && (
                  <p className="text-danger text-xs mt-1">{registerForm.formState.errors.email.message as string}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1" /> Mobile (optional)
                </label>
                <input {...registerForm.register("phone")} type="tel" placeholder="9876543210" className="input-field" />
                {registerForm.formState.errors.phone && (
                  <p className="text-danger text-xs mt-1">{(registerForm.formState.errors.phone as any)?.message as string}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  <Lock className="w-3.5 h-3.5 inline mr-1" /> Password
                </label>
                <div className="relative">
                  <input
                    {...registerForm.register("password")}
                    type={showPass ? "text" : "password"}
                    placeholder="Min 8 characters"
                    className="input-field pr-10"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-danger text-xs mt-1">{registerForm.formState.errors.password.message as string}</p>
                )}
              </div>
              {registerForm.formState.errors.root && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                  {registerForm.formState.errors.root.message}
                </div>
              )}
              <button type="submit" disabled={registerForm.formState.isSubmitting} className="btn-primary w-full">
                {registerForm.formState.isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                ) : "Create Account"}
              </button>
            </form>
          )}

          {/* OTP Verification */}
          {tab === "otp" && (
            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">📱</div>
                <h3 className="font-semibold text-slate-200">Verify your account</h3>
                <p className="text-sm text-muted mt-1">
                  Enter the 6-digit OTP sent to your phone/email.
                  <br />
                  <span className="text-warning text-xs">(In dev mode, check the API console log)</span>
                </p>
              </div>
              <div>
                <input
                  {...otpForm.register("otp")}
                  placeholder="6-digit OTP"
                  maxLength={6}
                  className="input-field text-center text-2xl tracking-widest"
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-danger text-xs mt-1 text-center">{otpForm.formState.errors.otp.message as string}</p>
                )}
              </div>
              {otpForm.formState.errors.root && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                  {otpForm.formState.errors.root.message}
                </div>
              )}
              <button type="submit" disabled={otpForm.formState.isSubmitting} className="btn-primary w-full">
                {otpForm.formState.isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                ) : "Verify OTP"}
              </button>
              <button type="button" onClick={() => setTab("register")} className="w-full text-sm text-muted hover:text-slate-300 transition-colors">
                ← Back to register
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
