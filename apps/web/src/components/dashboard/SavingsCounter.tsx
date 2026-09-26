import React from "react";
import { TrendingDown, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface SavingsCounterProps {
  totalSpent: number;
  individualAggregatorEstimate?: number;
  tripsCount: number;
  className?: string;
}

export const SavingsCounter: React.FC<SavingsCounterProps> = ({
  totalSpent,
  individualAggregatorEstimate,
  tripsCount,
  className = "",
}) => {
  // DB Best Worlds honest pricing saves ~18-22% on aggregator markups + convenience fees
  const aggregatorCost = individualAggregatorEstimate || Math.round(totalSpent * 1.22);
  const totalSaved = Math.max(0, aggregatorCost - totalSpent);
  const savingsPercent = Math.round((totalSaved / (aggregatorCost || 1)) * 100);

  return (
    <Card
      variant="gradient"
      className={`border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-surface to-surface p-5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-text-main">
                Zero-Markup Savings Counter
              </h4>
              <Badge variant="success" size="sm" dot>
                {savingsPercent}% Saved
              </Badge>
            </div>
            <p className="text-xs text-muted-fg mt-0.5">
              Saved across {tripsCount} booked {tripsCount === 1 ? "journey" : "journeys"} vs separate booking portals.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 border-surface-border pt-3 sm:pt-0">
          <span className="text-[11px] text-muted-fg font-medium uppercase tracking-wider block">
            Total Money Saved
          </span>
          <div className="text-2xl font-extrabold font-mono text-emerald-500 flex items-center sm:justify-end gap-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>₹{totalSaved.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SavingsCounter;
