import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, Train, Hotel, Car, Clock, AlertTriangle, CheckCircle2,
  XCircle, User, ChevronDown, ChevronUp, Activity, Filter
} from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WaitlistStatusBadge } from "@/components/booking/WaitlistStatusBadge";
import { SagaObservabilityPanel } from "@/components/ops/SagaObservabilityPanel";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  TRAIN: <Train className="w-4 h-4" />,
  HOTEL: <Hotel className="w-4 h-4" />,
  CAB: <Car className="w-4 h-4" />,
};

function BookingCard({ booking }: { booking: any }) {
  const [expanded, setExpanded] = useState(false);
  const [showSaga, setShowSaga] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [failReason, setFailReason] = useState("");
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const isSlaBreached =
    booking.slaDeadline && new Date(booking.slaDeadline) < new Date();

  const claim = useMutation({
    mutationFn: () => api.patch(`/ops/${booking.id}/claim`),
    onSuccess: () => {
      addToast({ type: "success", message: `Claimed task for ${booking.type}` });
      queryClient.invalidateQueries({ queryKey: ["ops-bookings"] });
    },
  });

  const confirm = useMutation({
    mutationFn: () => api.patch(`/ops/${booking.id}/confirm`, { referenceCode: refCode }),
    onSuccess: () => {
      addToast({ type: "success", title: "Confirmed", message: `Reference code ${refCode} verified and saved.` });
      queryClient.invalidateQueries({ queryKey: ["ops-bookings"] });
    },
  });

  const fail = useMutation({
    mutationFn: () => api.patch(`/ops/${booking.id}/fail`, { reason: failReason }),
    onSuccess: () => {
      addToast({ type: "error", title: "Segment Failed", message: "Failure recorded. Saga rollback initiated." });
      queryClient.invalidateQueries({ queryKey: ["ops-bookings"] });
    },
  });

  return (
    <Card
      variant="default"
      className={`p-5 transition-all space-y-3 ${
        isSlaBreached ? "border-danger-500/50 bg-danger-500/5" : "border-surface-border"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-brand-500 shrink-0">
            {TYPE_ICONS[booking.type]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text-main">{booking.type}</span>
              {isSlaBreached && (
                <Badge variant="danger" size="sm" dot>SLA BREACH</Badge>
              )}
              {booking.claimedByUserId && (
                <Badge variant="brand" size="sm">
                  <User className="w-2.5 h-2.5 mr-1" /> Claimed
                </Badge>
              )}
              <WaitlistStatusBadge status={booking.status} />
            </div>
            <p className="text-sm font-semibold text-text-main mt-0.5">{booking.trip?.destination}</p>
            <p className="text-xs text-muted-fg">
              {booking.trip?.startDate ? new Date(booking.trip.startDate).toLocaleDateString("en-IN") : ""} ·{" "}
              {booking.trip?.travelers} Traveler{booking.trip?.travelers > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-bold font-mono text-sm text-text-main">
            ₹{booking.amount?.toLocaleString("en-IN")}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-muted-fg hover:text-text-main hover:bg-surface-hover transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SLA timer */}
      {booking.slaDeadline && (
        <div className={`flex items-center gap-2 text-xs font-semibold ${isSlaBreached ? "text-danger-500" : "text-warning-500"}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>Fulfillment SLA Deadline: {new Date(booking.slaDeadline).toLocaleTimeString("en-IN")}</span>
          {isSlaBreached && <span className="font-mono">(EXCEEDED)</span>}
        </div>
      )}

      {/* Traveler contact */}
      {booking.trip?.user && (
        <div className="bg-surface-hover/60 rounded-lg px-3 py-2 text-xs text-muted-fg flex items-center justify-between">
          <span className="font-medium text-text-main">{booking.trip.user.name}</span>
          {booking.trip.user.phone && (
            <a href={`tel:${booking.trip.user.phone}`} className="text-brand-500 font-mono hover:underline">
              {booking.trip.user.phone}
            </a>
          )}
        </div>
      )}

      {/* Expanded actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-3 border-t border-surface-border space-y-3"
          >
            {/* Claim button */}
            {!booking.claimedByUserId && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => claim.mutate()}
                isLoading={claim.isPending}
                className="w-full"
              >
                Claim This Fulfillment Task
              </Button>
            )}

            {/* Confirm Reference */}
            <div className="flex gap-2">
              <input
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                placeholder="Vendor reference code (IRCTC PNR / Booking ID)"
                className="flex-1 px-3 py-2 text-xs bg-surface-hover/60 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => confirm.mutate()}
                disabled={!refCode}
                isLoading={confirm.isPending}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm
              </Button>
            </div>

            {/* Fail Action */}
            <div className="flex gap-2">
              <input
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                placeholder="Reason for failure (e.g. No availability, vendor timeout)"
                className="flex-1 px-3 py-2 text-xs bg-surface-hover/60 border border-danger-500/30 rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-danger-500"
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => fail.mutate()}
                disabled={!failReason}
                isLoading={fail.isPending}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Mark Failed
              </Button>
            </div>

            {/* Saga Observability Toggle */}
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaga(!showSaga)}
                className="text-xs text-brand-500"
                leftIcon={<Activity className="w-3.5 h-3.5" />}
              >
                {showSaga ? "Hide" : "Inspect"} Distributed Saga Audit Trail
              </Button>

              {showSaga && booking.tripId && (
                <div className="mt-2">
                  <SagaObservabilityPanel tripId={booking.tripId} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function OpsPage() {
  const [filter, setFilter] = useState<"ALL" | "TRAIN" | "HOTEL" | "CAB">("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["ops-bookings", filter],
    queryFn: async () => {
      const params = filter !== "ALL" ? `?type=${filter}` : "";
      const res = await api.get(`/ops/bookings/pending${params}`);
      return res.data;
    },
    refetchInterval: 25000,
  });

  const bookings = data?.bookings || [];
  const breached = bookings.filter((b: any) => b.slaDeadline && new Date(b.slaDeadline) < new Date());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16 px-4 max-w-5xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-warning-500" />
            <h1 className="text-2xl font-extrabold text-text-main">
              Operations & Fulfillment Desk
            </h1>
          </div>
          <p className="text-muted-fg text-sm">
            Review pending fulfillment tasks, inspect distributed sagas, and resolve manual bookings.
          </p>
        </div>
        {breached.length > 0 && (
          <Badge variant="danger" size="md" dot className="animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {breached.length} SLA Breached
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "TRAIN", "HOTEL", "CAB"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === f
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-surface border border-surface-border text-muted-fg hover:text-text-main"
            }`}
          >
            {f !== "ALL" && TYPE_ICONS[f]}
            <span>{f}</span>
            {f !== "ALL" && bookings.filter((b: any) => b.type === f).length > 0 && (
              <span className="badge-pill bg-warning-500/20 text-warning-500 px-1.5 py-0.2 rounded text-[10px]">
                {bookings.filter((b: any) => b.type === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : bookings.length === 0 ? (
        <Card variant="default" className="text-center py-16 space-y-2">
          <CheckCircle2 className="w-12 h-12 text-success-500 mx-auto" />
          <p className="text-text-main font-bold text-base">All Fulfillment Queues Clear</p>
          <p className="text-xs text-muted-fg">No pending manual booking tasks currently require intervention.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: any) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
