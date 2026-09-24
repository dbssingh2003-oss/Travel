import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Train, Hotel, Car, CheckCircle2, XCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { socket, subscribeTripUpdates, unsubscribeTripUpdates } from "@/lib/socket";

type LegStatus = "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED";

interface LegState {
  status: LegStatus;
  referenceCode?: string;
}

const LEG_ICONS = {
  TRAIN: <Train className="w-5 h-5" />,
  HOTEL: <Hotel className="w-5 h-5" />,
  CAB: <Car className="w-5 h-5" />,
};

const LEG_LABELS = {
  TRAIN: "Train / Transport",
  HOTEL: "Hotel Stay",
  CAB: "Local Cab",
};

function StatusIcon({ status }: { status: LegStatus }) {
  if (status === "CONFIRMED")
    return <CheckCircle2 className="w-6 h-6 text-success" />;
  if (status === "FAILED" || status === "CANCELLED")
    return <XCircle className="w-6 h-6 text-danger" />;
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Clock className="w-6 h-6 text-warning" />
    </motion.div>
  );
}

function PulsingDot({ status }: { status: LegStatus }) {
  if (status !== "PENDING") return null;
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-warning" />
    </span>
  );
}

export function LiveBookingProgress({
  tripId,
  onComplete,
}: {
  tripId: string;
  onComplete?: (status: "BOOKED" | "FAILED") => void;
}) {
  const [legs, setLegs] = useState<Record<string, LegState>>({
    TRAIN: { status: "PENDING" },
    HOTEL: { status: "PENDING" },
    CAB:   { status: "PENDING" },
  });
  const [tripStatus, setTripStatus] = useState<"CONFIRMING" | "BOOKED" | "FAILED">("CONFIRMING");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    subscribeTripUpdates(tripId);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onBookingUpdate = (e: any) => {
      setLegs((prev) => ({
        ...prev,
        [e.leg]: { status: e.status, referenceCode: e.referenceCode },
      }));
    };

    const onTripComplete = (e: any) => {
      setTripStatus(e.status === "BOOKED" ? "BOOKED" : "FAILED");
      onComplete?.(e.status === "BOOKED" ? "BOOKED" : "FAILED");
    };

    const onTripFailed = () => {
      setTripStatus("FAILED");
      onComplete?.("FAILED");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("BOOKING_UPDATE", onBookingUpdate);
    socket.on("TRIP_COMPLETE", onTripComplete);
    socket.on("TRIP_FAILED", onTripFailed);

    if (socket.connected) setConnected(true);

    return () => {
      unsubscribeTripUpdates(tripId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("BOOKING_UPDATE", onBookingUpdate);
      socket.off("TRIP_COMPLETE", onTripComplete);
      socket.off("TRIP_FAILED", onTripFailed);
    };
  }, [tripId, onComplete]);

  const allLegs = (["TRAIN", "HOTEL", "CAB"] as const);

  return (
    <div className="space-y-4">
      {/* Connection indicator */}
      <div className="flex items-center gap-2 text-xs">
        {connected ? (
          <><Wifi className="w-3 h-3 text-success" /><span className="text-success">Live updates active</span></>
        ) : (
          <><WifiOff className="w-3 h-3 text-warning" /><span className="text-warning">Connecting…</span></>
        )}
      </div>

      {/* Progress line connecting legs */}
      <div className="relative">
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />
        <div className="space-y-4">
          {allLegs.map((leg, i) => {
            const { status, referenceCode } = legs[leg];
            return (
              <motion.div
                key={leg}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-500 ${
                  status === "CONFIRMED"
                    ? "border-success/30 bg-success/5"
                    : status === "FAILED" || status === "CANCELLED"
                    ? "border-danger/30 bg-danger/5"
                    : "border-border bg-surface-2"
                }`}
              >
                {/* Icon */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    status === "CONFIRMED"
                      ? "bg-success/20 text-success"
                      : status === "FAILED"
                      ? "bg-danger/20 text-danger"
                      : "bg-surface text-muted"
                  }`}
                >
                  {LEG_ICONS[leg]}
                  <div className="absolute -top-1 -right-1">
                    <PulsingDot status={status} />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-200">{LEG_LABELS[leg]}</p>
                    <StatusIcon status={status} />
                  </div>
                  {status === "CONFIRMED" && referenceCode && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-success mt-1 font-mono"
                    >
                      Ref: {referenceCode}
                    </motion.p>
                  )}
                  {status === "PENDING" && (
                    <p className="text-sm text-muted-fg mt-1 animate-pulse">
                      Our team is arranging this for you…
                    </p>
                  )}
                  {(status === "FAILED" || status === "CANCELLED") && (
                    <p className="text-sm text-danger mt-1">
                      {status === "FAILED" ? "Could not confirm. Refund initiated." : "Cancelled."}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Overall status */}
      {tripStatus !== "CONFIRMING" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl text-center font-semibold ${
            tripStatus === "BOOKED"
              ? "bg-success/10 border border-success/30 text-success"
              : "bg-danger/10 border border-danger/30 text-danger"
          }`}
        >
          {tripStatus === "BOOKED" ? "🎉 All bookings confirmed!" : "⚠️ Booking failed — refund initiated"}
        </motion.div>
      )}
    </div>
  );
}
