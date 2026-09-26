import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCcw, PlayCircle, ShieldAlert } from "lucide-react";
import { Badge } from "../ui/Badge";
import { socket } from "../../lib/socket";

export interface SagaEventItem {
  id?: string;
  step: string;
  status: "STARTED" | "SUCCEEDED" | "FAILED" | "COMPENSATED" | string;
  detail?: Record<string, any>;
  createdAt?: string;
}

interface SagaTimelineProps {
  tripId: string;
  initialEvents?: SagaEventItem[];
  className?: string;
}

export const SagaTimeline: React.FC<SagaTimelineProps> = ({
  tripId,
  initialEvents = [],
  className = "",
}) => {
  const [events, setEvents] = useState<SagaEventItem[]>(initialEvents);

  useEffect(() => {
    const handleSagaStep = (event: SagaEventItem) => {
      setEvents((prev) => [...prev, event]);
    };

    socket.on(`trip:${tripId}:saga:step`, handleSagaStep);

    return () => {
      socket.off(`trip:${tripId}:saga:step`, handleSagaStep);
    };
  }, [tripId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return <Badge variant="success" size="sm" dot>Success</Badge>;
      case "STARTED":
        return <Badge variant="brand" size="sm" dot>In Progress</Badge>;
      case "FAILED":
        return <Badge variant="danger" size="sm" dot>Failed</Badge>;
      case "COMPENSATED":
        return <Badge variant="warning" size="sm" dot>Compensated (Rolled Back)</Badge>;
      default:
        return <Badge variant="muted" size="sm">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return <CheckCircle2 className="w-4 h-4 text-success-500" />;
      case "STARTED":
        return <PlayCircle className="w-4 h-4 text-brand-500 animate-pulse" />;
      case "FAILED":
        return <ShieldAlert className="w-4 h-4 text-danger-500" />;
      case "COMPENSATED":
        return <RefreshCcw className="w-4 h-4 text-warning-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-fg" />;
    }
  };

  if (events.length === 0) {
    return (
      <div className={`p-4 rounded-xl border border-surface-border bg-surface/50 text-center text-xs text-muted-fg ${className}`}>
        No saga transaction events recorded yet.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative pl-6 border-l-2 border-surface-border/80 space-y-4">
        {events.map((evt, idx) => (
          <div key={evt.id || idx} className="relative group">
            {/* Timeline icon */}
            <div className="absolute -left-[31px] top-0.5 p-1 rounded-full bg-surface border border-surface-border">
              {getStatusIcon(evt.status)}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-text-main">
                  {evt.step.replace(/_/g, " ")}
                </span>
                {getStatusBadge(evt.status)}
              </div>
              {evt.createdAt && (
                <span className="text-[11px] text-muted-fg font-mono">
                  {new Date(evt.createdAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            {evt.detail && Object.keys(evt.detail).length > 0 && (
              <div className="mt-1.5 p-2 rounded-lg bg-surface-hover/50 border border-surface-border/50 text-[11px] font-mono text-muted-fg overflow-x-auto">
                {JSON.stringify(evt.detail)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SagaTimeline;
