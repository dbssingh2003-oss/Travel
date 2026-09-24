import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, Train, Hotel, Car, Clock, AlertTriangle, CheckCircle2,
  XCircle, Loader2, User, ChevronDown, ChevronUp,
} from "lucide-react";
import { api } from "@/lib/api";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  TRAIN: <Train className="w-4 h-4" />,
  HOTEL: <Hotel className="w-4 h-4" />,
  CAB: <Car className="w-4 h-4" />,
};

function BookingCard({ booking }: { booking: any }) {
  const [expanded, setExpanded] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [failReason, setFailReason] = useState("");
  const queryClient = useQueryClient();

  const isSlaBreached =
    booking.slaDeadline && new Date(booking.slaDeadline) < new Date();

  const claim = useMutation({
    mutationFn: () => api.patch(`/ops/${booking.id}/claim`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops-bookings"] }),
  });

  const confirm = useMutation({
    mutationFn: () => api.patch(`/ops/${booking.id}/confirm`, { referenceCode: refCode }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops-bookings"] }),
  });

  const fail = useMutation({
    mutationFn: () => api.patch(`/ops/${booking.id}/fail`, { reason: failReason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops-bookings"] }),
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 border ${
        isSlaBreached ? "border-danger/50 bg-danger/5" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-accent">
            {TYPE_ICONS[booking.type]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-200">{booking.type}</p>
              {isSlaBreached && (
                <span className="badge badge-danger text-xs">⚠ SLA BREACH</span>
              )}
              {booking.claimedByUserId && (
                <span className="badge badge-primary text-xs">
                  <User className="w-2.5 h-2.5" /> Claimed
                </span>
              )}
            </div>
            <p className="text-sm text-muted-fg">{booking.trip?.destination}</p>
            <p className="text-xs text-muted-fg">
              {new Date(booking.trip?.startDate).toLocaleDateString("en-IN")} ·{" "}
              {booking.trip?.travelers} traveler{booking.trip?.travelers > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">₹{booking.amount?.toLocaleString("en-IN")}</span>
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-muted hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SLA timer */}
      {booking.slaDeadline && (
        <div className={`flex items-center gap-2 mt-3 text-xs ${isSlaBreached ? "text-danger" : "text-warning"}`}>
          <Clock className="w-3.5 h-3.5" />
          SLA: {new Date(booking.slaDeadline).toLocaleTimeString("en-IN")}
          {isSlaBreached && " (BREACHED)"}
        </div>
      )}

      {/* Traveler info */}
      {booking.trip?.user && (
        <div className="mt-3 bg-surface-2 rounded-lg px-3 py-2 text-xs text-muted-fg">
          <span className="text-slate-300">{booking.trip.user.name}</span> ·{" "}
          {booking.trip.user.phone && <a href={`tel:${booking.trip.user.phone}`} className="text-accent">{booking.trip.user.phone}</a>}
        </div>
      )}

      {/* Expanded actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {/* Claim */}
              {!booking.claimedByUserId && (
                <button
                  onClick={() => claim.mutate()}
                  disabled={claim.isPending}
                  className="btn-secondary w-full text-sm"
                >
                  {claim.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Claim this task"}
                </button>
              )}

              {/* Confirm */}
              <div className="flex gap-2">
                <input
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  placeholder="Reference code (PNR / booking ID)"
                  className="input-field flex-1 text-sm py-2"
                />
                <button
                  onClick={() => confirm.mutate()}
                  disabled={!refCode || confirm.isPending}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  {confirm.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm
                </button>
              </div>

              {/* Fail */}
              <div className="flex gap-2">
                <input
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  placeholder="Failure reason (e.g. No availability)"
                  className="input-field flex-1 text-sm py-2 border-danger/30"
                />
                <button
                  onClick={() => fail.mutate()}
                  disabled={!failReason || fail.isPending}
                  className="bg-danger/10 border border-danger/30 text-danger px-4 py-2 rounded-xl text-sm hover:bg-danger/20 transition-colors disabled:opacity-50"
                >
                  {fail.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Fail
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
    refetchInterval: 30000, // Poll every 30s
  });

  const bookings = data?.bookings || [];
  const breached = bookings.filter((b: any) => b.slaDeadline && new Date(b.slaDeadline) < new Date());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16"
    >
      <div className="section">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-warning" />
              <h1 className="text-2xl font-bold">Ops Dashboard</h1>
            </div>
            <p className="text-muted text-sm">Pending fulfillment tasks — claim, confirm, or fail</p>
          </div>
          {breached.length > 0 && (
            <div className="badge badge-danger">
              <AlertTriangle className="w-3 h-3" /> {breached.length} SLA breached
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["ALL", "TRAIN", "HOTEL", "CAB"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-muted hover:text-white border border-border"
              }`}
            >
              {f !== "ALL" && <span className="mr-1">{TYPE_ICONS[f]}</span>}
              {f}
              {f !== "ALL" && bookings.filter((b: any) => b.type === f).length > 0 && (
                <span className="ml-1.5 badge badge-warning text-xs py-0.5 px-1.5">
                  {bookings.filter((b: any) => b.type === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-slate-200 font-semibold">All clear! No pending tasks.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: any) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
