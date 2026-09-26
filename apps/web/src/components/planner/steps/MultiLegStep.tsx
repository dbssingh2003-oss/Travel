import React from "react";
import { Plus, Trash2, ArrowUpDown, MapPin, Calendar, Compass } from "lucide-react";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Badge } from "../../ui/Badge";

export interface TripLegInput {
  id?: string;
  sequence: number;
  originCity: string;
  destination: string;
  startDate: string;
  endDate: string;
}

interface MultiLegStepProps {
  legs: TripLegInput[];
  onChange: (legs: TripLegInput[]) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export const MultiLegStep: React.FC<MultiLegStepProps> = ({
  legs,
  onChange,
  onNext,
  onBack,
}) => {
  const addLeg = () => {
    const lastLeg = legs[legs.length - 1];
    const newLeg: TripLegInput = {
      sequence: legs.length + 1,
      originCity: lastLeg ? lastLeg.destination : "",
      destination: "",
      startDate: lastLeg ? lastLeg.endDate : "",
      endDate: "",
    };
    onChange([...legs, newLeg]);
  };

  const removeLeg = (index: number) => {
    if (legs.length <= 1) return;
    const updated = legs
      .filter((_, i) => i !== index)
      .map((leg, i) => ({ ...leg, sequence: i + 1 }));
    onChange(updated);
  };

  const updateLeg = (index: number, field: keyof TripLegInput, value: any) => {
    const updated = [...legs];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
          <Compass className="w-5 h-5 text-brand-500" />
          <span>Multi-City / Multi-Leg Journey</span>
        </h3>
        <p className="text-sm text-muted-fg mt-1">
          Customize multiple stops or transit legs with independent dates.
        </p>
      </div>

      <div className="space-y-4">
        {legs.map((leg, idx) => (
          <Card key={idx} variant="default" className="relative p-4 sm:p-5 border-surface-border">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="brand" size="sm">
                Leg #{leg.sequence}
              </Badge>
              {legs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLeg(idx)}
                  className="text-muted-fg hover:text-danger-500 p-1 transition-colors"
                  title="Remove this leg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-fg mb-1">
                  Origin City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-muted-fg absolute left-3 top-3" />
                  <input
                    type="text"
                    value={leg.originCity}
                    onChange={(e) => updateLeg(idx, "originCity", e.target.value)}
                    placeholder="e.g. New Delhi (NDLS)"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-fg mb-1">
                  Destination City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-brand-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={leg.destination}
                    onChange={(e) => updateLeg(idx, "destination", e.target.value)}
                    placeholder="e.g. Varanasi (BSB)"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-fg mb-1">
                  Departure Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-muted-fg absolute left-3 top-3" />
                  <input
                    type="date"
                    value={leg.startDate}
                    onChange={(e) => updateLeg(idx, "startDate", e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-fg mb-1">
                  Return / Stay End Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-muted-fg absolute left-3 top-3" />
                  <input
                    type="date"
                    value={leg.endDate}
                    onChange={(e) => updateLeg(idx, "endDate", e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLeg}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Another Stop / Leg
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onBack && (
            <Button type="button" variant="secondary" size="md" onClick={onBack}>
              Back
            </Button>
          )}
          {onNext && (
            <Button type="button" variant="primary" size="md" onClick={onNext}>
              Continue to Budget
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiLegStep;
