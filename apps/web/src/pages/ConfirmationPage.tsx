import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Train, Hotel, Car, Phone, Download, CheckCircle2, Loader2, LayoutDashboard, ArrowLeft } from "lucide-react";
import { tripsApi } from "@/lib/apiService";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  TRAIN: <Train className="w-5 h-5" />,
  HOTEL: <Hotel className="w-5 h-5" />,
  CAB: <Car className="w-5 h-5" />,
};

const TYPE_LABELS: Record<string, string> = {
  TRAIN: "Train / Transport",
  HOTEL: "Hotel Stay",
  CAB: "Local Cab",
};

export default function ConfirmationPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const isValidTripId = Boolean(tripId && tripId !== "undefined" && tripId.trim() !== "");

  const { data, isLoading } = useQuery({
    queryKey: ["confirmation", tripId],
    queryFn: async () => {
      if (!isValidTripId) throw new Error("Invalid Trip ID");
      return await tripsApi.getConfirmation(tripId!);
    },
    enabled: isValidTripId,
    refetchInterval: (query) => {
      const d = query.state.data as any;
      const hasAllConfirmed = d?.bookings?.every((b: any) => b.status === "CONFIRMED");
      return hasAllConfirmed ? false : 15000;
    },
  });

  if (!isValidTripId) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">No Active Trip Selected</h2>
          <p className="text-muted text-sm mb-6">
            Please select a trip from your dashboard.
          </p>
          <button onClick={() => navigate("/dashboard")} className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16"
    >
      <div className="section max-w-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="w-20 h-20 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center mx-auto mb-4 shadow-glow-success">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h1 className="text-3xl font-bold mb-1">
                You're <span className="gradient-text">All Set!</span>
              </h1>
              <p className="text-muted text-sm">
                Trip to <strong className="text-slate-100">{data?.trip?.destination}</strong> is confirmed.
              </p>
            </motion.div>

            {/* Bookings summary cards */}
            <div className="space-y-4 mb-8">
              {(data?.bookings || []).map((booking: any) => (
                <div key={booking.id} className="glass-card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        {TYPE_ICONS[booking.type] || <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs text-muted-fg">{TYPE_LABELS[booking.type] || booking.type}</p>
                        <h4 className="font-semibold text-slate-100">
                          {booking.vendor?.name || "Verified Vendor"}
                        </h4>
                      </div>
                    </div>
                    <span className="badge badge-success text-xs">
                      ✓ {booking.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
                    {booking.referenceCode && (
                      <div>
                        <span className="text-muted-fg">PNR / Ref Code</span>
                        <p className="font-mono font-bold text-accent">{booking.referenceCode}</p>
                      </div>
                    )}
                    {booking.vendor?.contactPhone && (
                      <div>
                        <span className="text-muted-fg">Vendor Contact</span>
                        <p className="font-medium flex items-center gap-1 text-slate-200">
                          <Phone className="w-3 h-3 text-muted" /> {booking.vendor.contactPhone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Itinerary PDF
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
