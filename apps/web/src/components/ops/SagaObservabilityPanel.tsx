import React, { useState } from "react";
import { Activity, RefreshCw, Eye } from "lucide-react";
import { SagaTimeline } from "../booking/SagaTimeline";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface SagaObservabilityPanelProps {
  tripId: string;
  onRetry?: () => void;
}

export const SagaObservabilityPanel: React.FC<SagaObservabilityPanelProps> = ({
  tripId,
  onRetry,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card variant="default" className="border-brand-500/20">
      <div className="flex items-center justify-between pb-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-main">Saga Distributed Transaction Log</h4>
            <p className="text-xs text-muted-fg font-mono">tripId: {tripId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry Saga
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-4">
          <SagaTimeline tripId={tripId} />
        </div>
      )}
    </Card>
  );
};

export default SagaObservabilityPanel;
