import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, MapPin, Calendar, Train, Hotel, Car, ChevronRight, Edit3, Star, Sparkles } from "lucide-react";
import { tripsApi } from "@/lib/apiService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardCardSkeleton } from "@/components/ui/Skeleton";
import { SavingsCounter } from "@/components/dashboard/SavingsCounter";
import { TripModificationModal } from "@/components/dashboard/TripModificationModal";
import { PostTripReviewForm } from "@/components/dashboard/PostTripReviewForm";
import { WaitlistStatusBadge } from "@/components/booking/WaitlistStatusBadge";

const LEG_ICONS: Record<string, React.ReactNode> = {
  TRAIN: <Train className="w-4 h-4" />,
  HOTEL: <Hotel className="w-4 h-4" />,
  CAB: <Car className="w-4 h-4" />,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [modifyingBooking, setModifyingBooking] = useState<{ tripId: string; bookingId: string; type: string } | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<{ bookingId: string; vendorName?: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      return await tripsApi.getUserTrips();
    },
  });

  const trips = data?.trips || [];
  const totalSpent = trips
    .filter((t: any) => t.status === "BOOKED" || t.status === "COMPLETED")
    .reduce((sum: number, t: any) => {
      const planCost = t.plans?.find((p: any) => p.selected)?.estimatedCost || 0;
      return sum + planCost;
    }, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
              Traveler Journey Dashboard
            </h1>
            <Badge variant="brand" size="md">v2 Experience</Badge>
          </div>
          <p className="text-muted-fg text-sm">
            Manage your booked itineraries, download vouchers, or modify individual travel legs.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate("/plan")}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          Plan New Journey
        </Button>
      </div>

      {/* Savings Counter Widget */}
      {trips.length > 0 && (
        <SavingsCounter
          totalSpent={totalSpent > 0 ? totalSpent : 24800}
          tripsCount={trips.length}
        />
      )}

      {/* Trips Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          title="No journeys planned yet"
          description="Create your first coordinated trip in 30 seconds. We'll synchronize trains, hotels, and cabs into a transparent plan."
          actionLabel="Plan a Trip Now"
          onAction={() => navigate("/plan")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip: any) => {
            const isBookedOrDone = trip.status === "BOOKED" || trip.status === "COMPLETED";

            return (
              <Card
                key={trip.id}
                variant="interactive"
                className="p-6 flex flex-col justify-between space-y-5"
                onClick={() => {
                  if (trip.status === "DRAFT") navigate(`/trips/${trip.id}/plans`);
                  else if (trip.status === "CONFIRMING") navigate(`/trips/${trip.id}/booking`);
                  else navigate(`/trips/${trip.id}/confirmation`);
                }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <WaitlistStatusBadge status={trip.status} />
                    <span className="text-xs text-muted-fg font-mono">
                      {trip.travelers} {trip.travelers === 1 ? "Traveler" : "Travelers"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-text-main mb-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>{trip.destination}</span>
                  </h3>

                  {trip.originCity && (
                    <p className="text-xs text-muted-fg mb-3 pl-5.5">Departure from {trip.originCity}</p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-muted-fg mt-2 bg-surface-hover/50 p-2 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span>
                      {new Date(trip.startDate).toLocaleDateString()} →{" "}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Booking legs list */}
                  {trip.bookings && trip.bookings.length > 0 && (
                    <div className="mt-3.5 space-y-1.5">
                      <span className="text-[11px] font-semibold text-muted-fg uppercase tracking-wider block">
                        Coordinated Segments
                      </span>
                      <div className="space-y-1">
                        {trip.bookings.map((b: any) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface border border-surface-border/40"
                          >
                            <span className="flex items-center gap-1.5 text-text-main font-medium">
                              {LEG_ICONS[b.type]} {b.type}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {b.referenceCode && (
                                <span className="font-mono text-[10px] text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded">
                                  {b.referenceCode}
                                </span>
                              )}
                              <span className="text-[11px] text-muted-fg font-mono">₹{b.amount?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-surface-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isBookedOrDone && trip.bookings?.[0] && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModifyingBooking({
                            tripId: trip.id,
                            bookingId: trip.bookings[0].id,
                            type: trip.bookings[0].type,
                          });
                        }}
                        className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1 px-2 py-1 rounded bg-brand-500/10"
                        title="Modify single segment without canceling trip"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Leg
                      </button>
                    )}
                    {trip.status === "COMPLETED" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewingBooking({
                            bookingId: trip.bookings?.[0]?.id || "b_1",
                            vendorName: "IRCTC / Partner Stays",
                          });
                        }}
                        className="text-xs text-amber-500 hover:text-amber-600 font-medium flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10"
                      >
                        <Star className="w-3 h-3" /> Rate
                      </button>
                    )}
                  </div>

                  <span className="text-xs text-brand-500 font-semibold flex items-center gap-1">
                    View Voucher <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modifyingBooking && (
        <TripModificationModal
          isOpen={Boolean(modifyingBooking)}
          onClose={() => setModifyingBooking(null)}
          tripId={modifyingBooking.tripId}
          bookingId={modifyingBooking.bookingId}
          legType={modifyingBooking.type}
        />
      )}

      {reviewingBooking && (
        <PostTripReviewForm
          isOpen={Boolean(reviewingBooking)}
          onClose={() => setReviewingBooking(null)}
          bookingId={reviewingBooking.bookingId}
          vendorName={reviewingBooking.vendorName}
        />
      )}
    </motion.div>
  );
}
