import React from "react";
import { CheckCircle2, Clock, AlertTriangle, HelpCircle } from "lucide-react";
import { Badge } from "../ui/Badge";

export interface WaitlistStatusBadgeProps {
  status: "CONFIRMED" | "WAITLISTED" | "RAC" | "PENDING" | "FAILED" | string;
  position?: number | string;
  probability?: "HIGH" | "MEDIUM" | "LOW" | number;
  className?: string;
}

export const WaitlistStatusBadge: React.FC<WaitlistStatusBadgeProps> = ({
  status,
  position,
  probability,
  className = "",
}) => {
  switch (status) {
    case "CONFIRMED":
      return (
        <Badge variant="success" size="md" dot className={className}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Confirmed</span>
        </Badge>
      );

    case "RAC":
      return (
        <div className={`inline-flex items-center gap-1.5 ${className}`}>
          <Badge variant="warning" size="md" dot>
            <Clock className="w-3.5 h-3.5" />
            <span>RAC {position ? `#${position}` : ""}</span>
          </Badge>
          <span className="text-[11px] text-muted-fg font-medium">
            (Guaranteed Seat / Shared Berth)
          </span>
        </div>
      );

    case "WAITLISTED":
      return (
        <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
          <Badge variant="warning" size="md" dot>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>WL {position ? `#${position}` : ""}</span>
          </Badge>
          {probability && (
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                probability === "HIGH" || (typeof probability === "number" && probability > 70)
                  ? "bg-success-500/10 text-success-500 border border-success-500/20"
                  : probability === "MEDIUM" || (typeof probability === "number" && probability > 40)
                  ? "bg-warning-500/10 text-warning-500 border border-warning-500/20"
                  : "bg-danger-500/10 text-danger-500 border border-danger-500/20"
              }`}
            >
              {typeof probability === "number"
                ? `${probability}% Confirmation Chance`
                : `${probability} Chance`}
            </span>
          )}
        </div>
      );

    case "PENDING":
      return (
        <Badge variant="brand" size="md" dot className={className}>
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>Processing Booking</span>
        </Badge>
      );

    case "FAILED":
      return (
        <Badge variant="danger" size="md" dot className={className}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Booking Failed</span>
        </Badge>
      );

    default:
      return (
        <Badge variant="muted" size="md" className={className}>
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{status}</span>
        </Badge>
      );
  }
};

export default WaitlistStatusBadge;
