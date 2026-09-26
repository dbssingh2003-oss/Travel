import React, { useState, useEffect } from "react";
import { Lock, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "../ui/Badge";
import { socket } from "../../lib/socket";

interface PriceLockBannerProps {
  tripId: string;
  initialSeconds?: number;
  lockedAmount?: number;
  onExpire?: () => void;
}

export const PriceLockBanner: React.FC<PriceLockBannerProps> = ({
  tripId,
  initialSeconds = 900, // 15 mins default
  lockedAmount,
  onExpire,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);

  useEffect(() => {
    // Listen for WebSocket price-lock updates
    const handleExpiring = (data: { secondsRemaining: number }) => {
      if (typeof data.secondsRemaining === "number") {
        setSecondsRemaining(data.secondsRemaining);
      }
    };

    socket.on(`trip:${tripId}:price-lock:expiring`, handleExpiring);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      socket.off(`trip:${tripId}:price-lock:expiring`, handleExpiring);
    };
  }, [tripId, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isUrgent = secondsRemaining > 0 && secondsRemaining <= 180; // 3 minutes left
  const isExpired = secondsRemaining === 0;

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 flex items-center justify-between gap-3 text-danger-500"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Price quote has expired. Fares may update on reload.</span>
        </div>
        <Badge variant="danger" size="sm">Expired</Badge>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
        isUrgent
          ? "border-warning-500/40 bg-warning-500/10 text-warning-500"
          : "border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isUrgent ? "bg-warning-500/20" : "bg-brand-500/20"}`}>
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <span>Price Guaranteed</span>
            {lockedAmount && (
              <span className="text-xs px-2 py-0.5 rounded bg-surface/80 border border-surface-border font-mono">
                ₹{lockedAmount.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-fg mt-0.5">
            Fares are locked in Redis quote buffer against surge pricing.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Clock className={`w-4 h-4 ${isUrgent ? "animate-pulse text-warning-500" : "text-muted-fg"}`} />
        <span className={`font-mono text-sm font-bold ${isUrgent ? "text-warning-500" : "text-text-main"}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        <Badge variant={isUrgent ? "warning" : "brand"} size="sm" dot>
          {isUrgent ? "Expiring Soon" : "Locked"}
        </Badge>
      </div>
    </motion.div>
  );
};

export default PriceLockBanner;
