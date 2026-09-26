import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Train, Hotel, Car, Wifi, WifiOff, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { socket, subscribeTripUpdates, unsubscribeTripUpdates } from "@/lib/socket";
import { WaitlistStatusBadge } from "./WaitlistStatusBadge";
import { SagaTimeline } from "./SagaTimeline";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type LegStatus = "PENDING" | "CONFIRMED" | "WAITLISTED" | "RAC" | "FAILED" | "CANCELLED";

interface LegState {
  status: LegStatus;
  referenceCode?: string;
  position?: number | string;
  probability?: string;
}

const LEG_ICONS = {
  TRAIN: <Train className="w-5 h-5" />,
  HOTEL: <Hotel className="w-5 h-5" />,
  CAB: <Car className="w-5 h-5" />,
};

const LEG_LABELS = {
  TRAIN: "Train / Transport",
  HOTEL: "Hotel / Stay",
  CAB: "Local Transfers",
};

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
  const [showSagaLogs, setShowSagaLogs] = useState(false);

  useEffect(() => {
    subscribeTripUpdates(tripId);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onBookingUpdate = (e: any) => {
      setLegs((prev) => ({
        ...prev,
        [e.leg]: {
          status: e.status,
          referenceCode: e.referenceCode,
          position: e.position,
          probability: e.probability,
        },
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

    const onWaitlisted = (e: any) => {
      if (e.leg) {
        setLegs((prev) => ({
          ...prev,
          [e.leg]: { status: "WAITLISTED", position: e.position },
        }));
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("BOOKING_UPDATE", onBookingUpdate);
    socket.on("TRIP_COMPLETE", onTripComplete);
    socket.on("TRIP_FAILED", onTripFailed);
    socket.on(`trip:${tripId}:booking:waitlisted`, onWaitlisted);

    if (socket.connected) setConnected(true);

    return () => {
      unsubscribeTripUpdates(tripId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("BOOKING_UPDATE", onBookingUpdate);
      socket.off("TRIP_COMPLETE", onTripComplete);
      socket.off("TRIP_FAILED", onTripFailed);
      socket.off(`trip:${tripId}:booking:waitlisted`, onWaitlisted);
    };
  }, [tripId, onComplete]);

  const legKeys = ["TRAIN", "HOTEL", "CAB"] as const;
  const completedCount = legKeys.filter((k) => legs[k]?.status === "CONFIRMED" || legs[k]?.status === "RAC").length;
  const progressPercent = Math.round((completedCount / legKeys.length) * 100);

  return (
    <div className="space-y-6">
      {/* Live status bar */}
      <div className="flex items-center justify-between text-xs text-muted-fg bg-surface-hover/60 px-4 py-2.5 rounded-xl border border-surface-border">
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
              </span>
              <span className="text-success-600 dark:text-success-400 font-semibold flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" /> Real-Time WebSocket Gateway Connected
              </span>
            </>
          ) : (
            <span className="text-muted-fg flex items-center gap-1">
              <WifiOff className="w-3.5 h-3.5 text-warning-500" /> Connecting to Real-Time Bridge…
            </span>
          )}
        </div>
        <span className="font-mono text-xs">{completedCount} of 3 Segments Locked</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-surface-border overflow-hidden">
        <motion.div
          className="h-full bg-brand-500 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Leg cards */}
      <div className="space-y-3.5">
        {legKeys.map((type, idx) => {
          const leg = legs[type] || { status: "PENDING" };
          const isDone = leg.status === "CONFIRMED" || leg.status === "RAC";

          return (
            <Card
              key={type}
              variant="default"
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
                isDone
                  ? "border-success-500/30 bg-success-500/5 shadow-sm"
                  : leg.status === "WAITLISTED"
                  ? "border-warning-500/30 bg-warning-500/5"
                  : leg.status === "FAILED" || leg.status === "CANCELLED"
                  ? "border-danger-500/30 bg-danger-500/5"
                  : "border-brand-500/20 bg-surface shadow-card"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDone
                      ? "bg-success-500/10 text-success-500"
                      : "bg-brand-500/10 text-brand-500"
                  }`}
                >
                  {LEG_ICONS[type]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text-main">{LEG_LABELS[type]}</span>
                    <span className="text-xs text-muted-fg font-mono">Step #{idx + 1}</span>
                  </div>
                  {leg.referenceCode ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-fg">Reference Code:</span>
                      <span className="font-mono text-xs font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                        {leg.referenceCode}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-fg mt-0.5">
                      {leg.status === "PENDING" ? "Orchestrating booking with vendor API..." : "Processing response"}
                    </p>
                  )}
                </div>
              </div>

              <div className="self-end sm:self-auto">
                <WaitlistStatusBadge
                  status={leg.status}
                  position={leg.position}
                  probability={leg.probability as any}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Saga Observability Timeline Toggle */}
      <div className="pt-2 border-t border-surface-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSagaLogs(!showSagaLogs)}
          className="text-xs text-muted-fg hover:text-text-main flex items-center gap-2"
        >
          <Activity className="w-3.5 h-3.5 text-brand-500" />
          <span>{showSagaLogs ? "Hide" : "Show"} Live Saga Transaction Timeline</span>
          {showSagaLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>

        <AnimatePresence>
          {showSagaLogs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 overflow-hidden"
            >
              <SagaTimeline tripId={tripId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LiveBookingProgress;
