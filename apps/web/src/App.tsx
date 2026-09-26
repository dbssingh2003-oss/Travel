import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import Navbar from "@/components/shared/Navbar";
import ToastContainer from "@/components/ui/Toast";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PlannerPage from "@/pages/PlannerPage";
import PlansPage from "@/pages/PlansPage";
import ConsentPage from "@/pages/ConsentPage";
import BookingProgressPage from "@/pages/BookingProgressPage";
import ConfirmationPage from "@/pages/ConfirmationPage";
import DashboardPage from "@/pages/DashboardPage";
import OpsPage from "@/pages/OpsPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function OpsRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "SUPPORT" && user.role !== "ADMIN")
    return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-text-main transition-colors duration-200">
      <Navbar />
      <ToastContainer />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/plan"
            element={
              <PrivateRoute>
                <PlannerPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/trips/:tripId/plans"
            element={
              <PrivateRoute>
                <PlansPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/trips/:tripId/consent"
            element={
              <PrivateRoute>
                <ConsentPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/trips/:tripId/booking"
            element={
              <PrivateRoute>
                <BookingProgressPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/trips/:tripId/confirmation"
            element={
              <PrivateRoute>
                <ConfirmationPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/ops"
            element={
              <OpsRoute>
                <OpsPage />
              </OpsRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
