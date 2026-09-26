import React, { useState } from "react";
import { Users, Copy, Check, Share2, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { useUIStore } from "../../store/uiStore";

export interface SplitShareItem {
  id: string;
  travelerId: string;
  name?: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | string;
  payLinkUrl?: string;
}

interface SplitPaymentPanelProps {
  totalAmount: number;
  shares: SplitShareItem[];
  onMarkPaid?: (shareId: string) => void;
  className?: string;
}

export const SplitPaymentPanel: React.FC<SplitPaymentPanelProps> = ({
  totalAmount,
  shares,
  onMarkPaid,
  className = "",
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { addToast } = useUIStore();

  const handleCopyLink = (share: SplitShareItem) => {
    if (share.payLinkUrl) {
      navigator.clipboard.writeText(share.payLinkUrl);
      setCopiedId(share.id);
      addToast({
        type: "success",
        title: "Link Copied",
        message: `Payment link for ${share.name || "traveler"} copied to clipboard!`,
      });
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleWhatsAppShare = (share: SplitShareItem) => {
    const text = `Hey! Here is your share of ₹${share.amount.toLocaleString()} for our DB Best Worlds trip booking: ${share.payLinkUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const totalPaid = shares
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + s.amount, 0);

  const percentPaid = Math.round((totalPaid / (totalAmount || 1)) * 100);

  return (
    <Card variant="default" className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-main">Split / Group Payments</h4>
            <p className="text-xs text-muted-fg">
              Share individual payment links with each member of your group.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-fg">Total Trip Fare</span>
          <p className="text-base font-bold font-mono text-text-main">
            ₹{totalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs text-muted-fg font-medium">
          <span>Collected: ₹{totalPaid.toLocaleString()} ({percentPaid}%)</span>
          <span>Remaining: ₹{(totalAmount - totalPaid).toLocaleString()}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-border overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-500 rounded-full"
            style={{ width: `${percentPaid}%` }}
          />
        </div>
      </div>

      {/* Share list */}
      <div className="space-y-2 pt-2">
        {shares.map((share, idx) => {
          const isPaid = share.status === "PAID";

          return (
            <div
              key={share.id || idx}
              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isPaid
                  ? "border-success-500/30 bg-success-500/5"
                  : "border-surface-border bg-surface-hover/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isPaid
                      ? "bg-success-500/20 text-success-500"
                      : "bg-brand-500/20 text-brand-500"
                  }`}
                >
                  {share.name ? share.name.substring(0, 2).toUpperCase() : `T${idx + 1}`}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-main flex items-center gap-2">
                    <span>{share.name || `Traveler ${idx + 1}`}</span>
                    {isPaid ? (
                      <Badge variant="success" size="sm" dot>
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm" dot>
                        Awaiting Payment
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-fg">
                    ₹{share.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {!isPaid && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(share)}
                      leftIcon={
                        copiedId === share.id ? (
                          <Check className="w-3.5 h-3.5 text-success-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {copiedId === share.id ? "Copied" : "Copy Link"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleWhatsAppShare(share)}
                      leftIcon={<Share2 className="w-3.5 h-3.5 text-emerald-500" />}
                    >
                      WhatsApp
                    </Button>
                    {onMarkPaid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkPaid(share.id)}
                        className="text-xs"
                      >
                        Mark Paid
                      </Button>
                    )}
                  </>
                )}
                {isPaid && (
                  <div className="flex items-center gap-1.5 text-xs text-success-500 font-semibold px-2 py-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Settled</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default SplitPaymentPanel;
