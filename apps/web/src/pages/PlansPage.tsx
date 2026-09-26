import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Train, Hotel, Car, IndianRupee, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { tripsApi } from "@/lib/apiService";
import { useTripStore } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PlanCardSkeleton } from "@/components/ui/Skeleton";
import { PriceLockBanner } from "@/components/booking/PriceLockBanner";

function PlanCard({
  plan,
  selected,
  onSelect,
  index,
}: {
  plan: any;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const tierBadgeVariant: Record<string, "success" | "brand" | "warning" | "accent"> = {
    "Budget Explorer": "success",
    Balanced: "brand",
    "Comfort Plus": "warning",
  };
  const variant = tierBadgeVariant[plan.label] || "brand";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className={`rounded-card border p-6 cursor-pointer transition-all duration-200 bg-surface shadow-card flex flex-col justify-between ${
        selected
          ? "border-brand-500 shadow-elevated ring-2 ring-brand-500/30"
          : "border-surface-border hover:border-brand-500/40"
      }`}
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge variant={variant} size="md" className="mb-2.5">
              {plan.label}
            </Badge>
            <div className="flex items-center gap-1 text-3xl font-black text-text-main font-mono">
              <span className="text-xl text-muted-fg font-normal">₹</span>
              <span>{plan.estimatedCost.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-xs text-muted-fg mt-0.5">Itemized All-Inclusive Package</p>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              selected ? "border-brand-500 bg-brand-500" : "border-surface-border"
            }`}
          >
            {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { icon: <Train className="w-3.5 h-3.5" />, label: "Transit (Train/Air)", value: plan.costBreakdown?.transport || 0 },
            { icon: <Hotel className="w-3.5 h-3.5" />, label: "Stay / Hotel", value: plan.costBreakdown?.stay || 0 },
            { icon: <Car className="w-3.5 h-3.5" />, label: "Local Transfer", value: plan.costBreakdown?.localTransport || 0 },
            { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Safety Buffer", value: plan.costBreakdown?.buffer || 0 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 bg-surface-hover/60 border border-surface-border/50 rounded-lg p-2.5">
              <span className="text-brand-500">{item.icon}</span>
              <div>
                <p className="text-[11px] text-muted-fg">{item.label}</p>
                <p className="text-xs font-bold font-mono text-text-main">₹{item.value.toLocaleString("en-IN")}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Itinerary preview */}
        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
          <span className="text-[11px] font-semibold text-muted-fg uppercase tracking-wider block">
            Day-Wise Schedule
          </span>
          {(plan.itinerary || []).slice(0, 3).map((day: any) => (
            <div key={day.day} className="flex gap-2.5 items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/10 text-brand-500 text-[11px] font-bold flex items-center justify-center mt-0.5">
                {day.day}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-main truncate">{day.title}</p>
                <p className="text-[11px] text-muted-fg line-clamp-1">{day.activities?.[0]}</p>
              </div>
            </div>
          ))}
          {(plan.itinerary || []).length > 3 && (
            <p className="text-[11px] text-brand-500 font-medium pl-7">+{plan.itinerary.length - 3} more structured days…</p>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-surface-border/60 mt-4">
        <Button
          variant={selected ? "primary" : "secondary"}
          size="sm"
          className="w-full"
        >
          {selected ? "Selected Plan" : "Choose This Plan"}
        </Button>
      </div>
    </motion.div>
  );
}

export default function PlansPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { setSelectedPlan } = useTripStore();
  const { addToast } = useUIStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);

  const isValidTripId = Boolean(tripId && tripId !== "undefined" && tripId.trim() !== "");

  const { data, isLoading, error } = useQuery({
    queryKey: ["plans", tripId],
    queryFn: async () => {
      if (!isValidTripId) throw new Error("Invalid Trip ID");
      const res = await tripsApi.getPlans(tripId!);
      return res;
    },
    enabled: isValidTripId,
  });

  useEffect(() => {
    if (data?.plans?.length && !selectedId) {
      const alreadySelected = data.plans.find((p: any) => p.selected);
      setSelectedId(alreadySelected?.id || data.plans[0].id);
    }
  }, [data, selectedId]);

  const selectedPlanObj = data?.plans?.find((p: any) => p.id === selectedId);

  const handleProceed = async () => {
    if (!selectedId || !isValidTripId) return;
    setSelecting(true);
    try {
      await tripsApi.selectPlan(tripId!, selectedId);
      const plan = data?.plans?.find((p: any) => p.id === selectedId);
      if (plan) setSelectedPlan(plan);
      addToast({
        type: "success",
        title: "Plan Selected",
        message: `Locked in ${plan?.label || "your plan"}. Reviewing price breakdown.`,
      });
      navigate(`/trips/${tripId}/consent`);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Selection Error",
        message: err.message || "Failed to select plan. Please try again.",
      });
    } finally {
      setSelecting(false);
    }
  };

  if (!isValidTripId) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
        <Card variant="default" className="p-8 text-center max-w-md space-y-4">
          <h2 className="text-xl font-bold text-text-main">No Active Trip Selected</h2>
          <p className="text-muted-fg text-sm">
            Please create or select a trip to view tailored itineraries.
          </p>
          <Button variant="primary" size="md" onClick={() => navigate("/plan")} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Start Planning
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto"
    >
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="brand" size="md" className="mx-auto">
            <Sparkles className="w-3.5 h-3.5" /> Tiered Options Generated
          </Badge>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
            Your Tailored Journey Plans
          </h1>
          <p className="text-muted-fg text-sm">
            Choose your preferred transit & accommodation balance. All quotes feature zero hidden markups.
          </p>
        </div>

        {/* Price Lock Banner */}
        {tripId && (
          <div className="max-w-4xl mx-auto">
            <PriceLockBanner tripId={tripId} lockedAmount={selectedPlanObj?.estimatedCost} />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            <PlanCardSkeleton />
          </div>
        ) : error ? (
          <Card variant="default" className="p-8 text-center max-w-md mx-auto space-y-4">
            <p className="text-danger-500 text-sm font-medium">
              {(error as any)?.message || "Failed to load plans."}
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate("/plan")}>
              Back to Planner
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {(data?.plans || []).map((plan: any, i: number) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedId === plan.id}
                  onSelect={() => setSelectedId(plan.id)}
                  index={i}
                />
              ))}
            </div>

            <AnimatePresence>
              {selectedId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center pt-4"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleProceed}
                    isLoading={selecting}
                    rightIcon={<ChevronRight className="w-5 h-5" />}
                    className="px-10 py-4 shadow-elevated text-base font-bold"
                  >
                    Proceed with {selectedPlanObj?.label || "Selected Plan"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}
