import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, MapPin, Calendar, Train, Hotel, Car, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "badge-primary",
  PLANNED: "badge-primary",
  CONFIRMING: "badge-warning",
  BOOKED: "badge-success",
  PARTIALLY_BOOKED: "badge-warning",
  CANCELLED: "badge-danger",
  COMPLETED: "badge-success",
};

const LEG_ICONS: Record<string, React.ReactNode> = {
  TRAIN: <Train className="w-3.5 h-3.5" />,
  HOTEL: <Hotel className="w-3.5 h-3.5" />,
  CAB: <Car className="w-3.5 h-3.5" />,
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const res = await api.get("/trips");
      return res.data;
    },
  });

  const trips = data?.trips || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16"
    >
      <div className="section">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              My <span className="gradient-text">Trips</span>
            </h1>
            <p className="text-muted text-sm">Track and manage all your adventures</p>
          </div>
          <button onClick={() => navigate("/plan")} className="btn-primary">
            <Plus className="w-4 h-4" /> New Trip
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : trips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 glass-card"
          >
            <div className="text-6xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">No trips yet</h3>
            <p className="text-muted mb-6">Start planning your first trip today!</p>
            <button onClick={() => navigate("/plan")} className="btn-primary">
              Plan my first trip
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip: any, i: number) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-5 cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => navigate(`/trips/${trip.id}/confirmation`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                    <h3 className="font-semibold text-slate-200 truncate">{trip.destination}</h3>
                  </div>
                  <span className={`badge text-xs flex-shrink-0 ml-2 ${STATUS_COLORS[trip.status] || "badge-primary"}`}>
                    {trip.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-fg mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(trip.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} →{" "}
                    {new Date(trip.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                {/* Booking legs */}
                {trip.bookings?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {trip.bookings.map((b: any) => (
                      <span
                        key={b.type}
                        className={`flex items-center gap-1 badge text-xs ${
                          b.status === "CONFIRMED" ? "badge-success" :
                          b.status === "PENDING" ? "badge-warning" :
                          b.status === "FAILED" ? "badge-danger" : "badge-primary"
                        }`}
                      >
                        {LEG_ICONS[b.type]} {b.status}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end mt-4">
                  <ChevronRight className="w-4 h-4 text-muted-fg" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
