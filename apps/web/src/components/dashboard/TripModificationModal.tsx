import React, { useState } from "react";
import { X, Edit3, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useUIStore } from "../../store/uiStore";

interface TripModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  bookingId: string;
  legType: "TRAIN" | "HOTEL" | "CAB" | string;
  currentDetails?: string;
  onConfirmModification?: (bookingId: string, newDetails: Record<string, any>) => Promise<void>;
}

export const TripModificationModal: React.FC<TripModificationModalProps> = ({
  isOpen,
  onClose,
  tripId,
  bookingId,
  legType,
  currentDetails,
  onConfirmModification,
}) => {
  const [newRequirement, setNewRequirement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUIStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequirement.trim()) return;

    setIsSubmitting(true);
    try {
      if (onConfirmModification) {
        await onConfirmModification(bookingId, { requestedChange: newRequirement });
      }
      addToast({
        type: "success",
        title: "Modification Requested",
        message: `Your change request for ${legType} has been submitted to the saga coordinator.`,
      });
      onClose();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Modification Failed",
        message: err?.message || "Failed to submit leg change.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-card border border-surface-border bg-surface shadow-elevated p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">Modify Trip Segment</h3>
              <p className="text-xs text-muted-fg font-mono">tripId: {tripId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-fg hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="brand" size="md">
            {legType} Segment
          </Badge>
          <span className="text-xs text-muted-fg">Single-Leg Mini-Saga Update</span>
        </div>

        {currentDetails && (
          <div className="p-3 rounded-lg bg-surface-hover/50 border border-surface-border text-xs">
            <span className="font-semibold text-muted-fg block mb-1">Current Booking Details:</span>
            <p className="text-text-main">{currentDetails}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Requested Modification / Upgrade
            </label>
            <textarea
              rows={3}
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="e.g. Upgrade to 2AC berth, change cab pickup time to 06:30 AM, or request late checkout..."
              className="w-full p-3 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div className="p-3 rounded-lg border border-brand-500/20 bg-brand-500/5 text-xs text-muted-fg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <span>
              DB Best Worlds mini-saga modifies only this specific segment without cancelling your other booked legs.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Submit Modification
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripModificationModal;
