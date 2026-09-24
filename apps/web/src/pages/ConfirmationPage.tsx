import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Train, Hotel, Car, Phone, Download, CheckCircle2, Loader2, LayoutDashboard } from "lucide-react";
import { api } from "@/lib/api";

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

  const { data, isLoading } = useQuery({
    queryKey: ["confirmation", tripId],
    queryFn: async () => {
      const res = await api.get(`/trips/${tripId}/confirmation`);
      return res.data;
    },
    enabled: !!tripId,
    refetchInterval: (query) => {
      const d = query.state.data as any;
      const hasAllConfirmed = d?.bookings?.every((b: any) => b.status === "CONFIRMED");
      return hasAllConfirmed ? false : 15000;
    },
  });

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
              <div className="w-20 h-20 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {data?.status === "BOOKED" ? (
                  <>Trip <span className="gradient-text">confirmed! 🎉</span></>
                ) : (
                  <>Booking in progress…</>
                )}
              </h1>
              <p className="text-muted">
                Total paid:{" "}
                <span className="text-white font-bold text-lg">
                  ₹{data?.totalPaid?.toLocaleString("en-IN") || "—"}
                </span>
              </p>
            </motion.div>

            {/* Booking cards */}
            <div className="space-y-4 mb-8">
              {(data?.bookings || []).map((booking: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-card p-5 border ${
                    booking.status === "CONFIRMED"
                      ? "border-success/30"
                      : booking.status === "PENDING"
                      ? "border-warning/30"
                      : "border-danger/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        booking.status === "CONFIRMED" ? "bg-success/15 text-success" : "bg-surface-2 text-muted"
                      }`}>
                        {TYPE_ICONS[booking.type]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{TYPE_LABELS[booking.type]}</p>
                        {booking.referenceCode && (
                          <p className="text-sm font-mono text-accent">{booking.referenceCode}</p>
                        )}
                      </div>
                    </div>
                    <span className={`badge text-xs ${
                      booking.status === "CONFIRMED" ? "badge-success" :
                      booking.status === "PENDING" ? "badge-warning" : "badge-danger"
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  {booking.vendor && (
                    <div className="bg-surface-2 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-fg">Vendor</p>
                        <p className="text-sm font-medium text-slate-200">{booking.vendor.name}</p>
                      </div>
                      {booking.vendor.phone && (
                        <a
                          href={`tel:${booking.vendor.phone}`}
                          className="flex items-center gap-1.5 text-sm text-accent hover:text-white transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {booking.vendor.phone}
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={data?.downloadUrl}
                className="btn-secondary flex-1 text-center"
                download
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-primary flex-1"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to My Trips
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-fg">
                Need help? Contact our 24/7 support at{" "}
                <a href="mailto:support@dbbestworlds.app" className="text-accent hover:underline">
                  support@dbbestworlds.app
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
