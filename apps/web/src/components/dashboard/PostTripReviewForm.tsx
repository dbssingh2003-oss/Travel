import React, { useState } from "react";
import { Star, MessageSquare, CheckCircle2, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useUIStore } from "../../store/uiStore";

interface PostTripReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId?: string;
  vendorName?: string;
  bookingId: string;
  onSubmitReview?: (data: { rating: number; comment: string; bookingId: string }) => Promise<void>;
}

export const PostTripReviewForm: React.FC<PostTripReviewFormProps> = ({
  isOpen,
  onClose,
  vendorId,
  vendorName = "Travel Service Vendor",
  bookingId,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUIStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (onSubmitReview) {
        await onSubmitReview({ rating, comment, bookingId });
      }
      addToast({
        type: "success",
        title: "Review Submitted",
        message: "Thank you for rating! Your review updates the vendor's community trust score.",
      });
      onClose();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Submission Failed",
        message: err?.message || "Could not submit review.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-card border border-surface-border bg-surface shadow-elevated p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">Rate Your Journey Experience</h3>
              <p className="text-xs text-muted-fg">{vendorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-fg hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center space-y-2 py-2">
            <span className="text-xs text-muted-fg font-medium">Select Star Rating:</span>
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-fg/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold font-mono text-amber-400">
              {rating === 5 ? "5.0 / 5.0 (Exceptional)" : `${rating}.0 / 5.0`}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">
              Your Feedback / Comment (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the punctuality, cleanliness, driver conduct, and comfort?"
              className="w-full p-3 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Submit Review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostTripReviewForm;
