import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, MapPin, Calendar, Train, Hotel, Car, ChevronRight, Loader2 } from "lucide-react";
import { tripsApi } from "@/lib/apiService";

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
      return await tripsApi.getUserTrips();
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
          <div className="glass-card p-12 text-center max-w-md mx-auto">
            <p className="text-4xl mb-3">🗺️</p>
            <h3 className="font-semibold text-slate-200 mb-1">No trips planned yet</h3>
            <p className="text-sm text-muted mb-6">
              Create your first trip in 30 seconds. We'll find the best trains, hotels & cabs.
            </p>
            <button onClick={() => navigate("/plan")} className="btn-primary">
              Plan a Trip
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip: any) => (
              <motion.div
                key={trip.id}
                whileHover={{ y: -4 }}
                onClick={() => {
                  if (trip.status === "DRAFT") navigate(`/trips/${trip.id}/plans`);
                  else if (trip.status === "CONFIRMING") navigate(`/trips/${trip.id}/booking`);
                  else navigate(`/trips/${trip.id}/confirmation`);
                }}
                className="glass-card p-6 cursor-pointer hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`badge ${STATUS_COLORS[trip.status] || "badge-primary"}`}>
                      {trip.status}
                    </span>
                    <span className="text-xs text-muted-fg font-mono">
                      {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    {trip.destination}
                  </h3>

                  {trip.originCity && (
                    <p className="text-xs text-muted-fg mb-3 pl-5.5">from {trip.originCity}</p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-muted-fg mt-2">
                    <Calendar className="w-3.5 h-3.5 text-muted" />
                    <span>
                      {new Date(trip.startDate).toLocaleDateString()} →{" "}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex gap-1.5 text-muted">
                    {(trip.bookings || []).map((b: any) => (
                      <span key={b.id} title={`${b.type}: ${b.status}`}>
                        {LEG_ICONS[b.type]}
                      </span>
                    ))}
                  </div>
                  <span className="text-primary font-medium flex items-center gap-1">
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
