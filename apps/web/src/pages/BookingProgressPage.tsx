import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { LiveBookingProgress } from "@/components/booking/LiveBookingProgress";
import { ArrowRight } from "lucide-react";

export default function BookingProgressPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const handleComplete = (status: "BOOKED" | "FAILED") => {
    if (status === "BOOKED") {
      setTimeout(() => navigate(`/trips/${tripId}/confirmation`), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="section max-w-lg relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            We're <span className="gradient-text">booking your trip</span>
          </h1>
          <p className="text-muted text-sm">
            Our team is coordinating with vendors right now. Hang tight — this usually takes
            a few minutes.
          </p>
        </div>

        <div className="glass-card p-6">
          {tripId && (
            <LiveBookingProgress tripId={tripId} onComplete={handleComplete} />
          )}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-surface-2 border border-border">
          <p className="text-xs text-muted-fg leading-relaxed text-center">
            💬 You'll receive an SMS/email confirmation once each leg is booked.
            <br />
            You can safely leave this page — your booking will continue in the background.
          </p>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate(`/trips/${tripId}/confirmation`)}
            className="btn-secondary text-sm"
          >
            View confirmation so far <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
