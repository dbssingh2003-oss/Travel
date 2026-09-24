import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, Train, Hotel, Car, IndianRupee, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { useTripStore } from "@/store/tripStore";

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
  const tierColors: Record<string, string> = {
    "Budget Explorer": "text-success border-success/30 bg-success/5",
    "Balanced": "text-primary border-primary/30 bg-primary/5",
    "Comfort Plus": "text-warning border-warning/30 bg-warning/5",
  };
  const colorClass = tierColors[plan.label] || "text-accent border-accent/30 bg-accent/5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className={`glass-card p-6 cursor-pointer transition-all duration-300 ${
        selected ? "border-primary shadow-glow-primary ring-1 ring-primary/30" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className={`badge text-xs font-semibold border ${colorClass} mb-2`}>{plan.label}</span>
          <div className="flex items-center gap-1 text-3xl font-black">
            <IndianRupee className="w-5 h-5 text-muted-fg" />
            <span className="gradient-text">{plan.estimatedCost.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-xs text-muted-fg">estimated total</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${selected ? "border-primary bg-primary" : "border-border"}`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { icon: <Train className="w-3 h-3" />, label: "Transport", value: plan.costBreakdown.transport },
          { icon: <Hotel className="w-3 h-3" />, label: "Stay", value: plan.costBreakdown.stay },
          { icon: <Car className="w-3 h-3" />, label: "Local cab", value: plan.costBreakdown.localTransport },
          { icon: <IndianRupee className="w-3 h-3" />, label: "Buffer", value: plan.costBreakdown.buffer },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2">
            <span className="text-muted">{item.icon}</span>
            <div>
              <p className="text-xs text-muted-fg">{item.label}</p>
              <p className="text-sm font-semibold">₹{item.value.toLocaleString("en-IN")}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Itinerary preview */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {(plan.itinerary || []).slice(0, 3).map((day: any) => (
          <div key={day.day} className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
              {day.day}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">{day.title}</p>
              <p className="text-xs text-muted-fg">{day.activities?.[0]}</p>
            </div>
          </div>
        ))}
        {(plan.itinerary || []).length > 3 && (
          <p className="text-xs text-muted-fg pl-9">+{plan.itinerary.length - 3} more days…</p>
        )}
      </div>
    </motion.div>
  );
}

export default function PlansPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { setSelectedPlan } = useTripStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["plans", tripId],
    queryFn: async () => {
      const res = await api.get(`/trips/${tripId}/plans`);
      return res.data;
    },
    enabled: !!tripId,
  });

  useEffect(() => {
    if (data?.plans?.length && !selectedId) {
      const alreadySelected = data.plans.find((p: any) => p.selected);
      setSelectedId(alreadySelected?.id || data.plans[0].id);
    }
  }, [data, selectedId]);

  const handleProceed = async () => {
    if (!selectedId || !tripId) return;
    setSelecting(true);
    try {
      await api.post(`/trips/${tripId}/select-plan`, { planId: selectedId });
      const plan = data?.plans.find((p: any) => p.id === selectedId);
      if (plan) setSelectedPlan(plan);
      navigate(`/trips/${tripId}/consent`);
    } catch (err) {
      alert("Failed to select plan. Please try again.");
    } finally {
      setSelecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16"
    >
      <div className="section">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Your <span className="gradient-text">tailored plans</span>
          </h1>
          <p className="text-muted text-sm">
            Choose the plan that fits your style. All prices include our platform fee.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted">Crafting your perfect plans…</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                  className="flex justify-center"
                >
                  <button
                    onClick={handleProceed}
                    disabled={selecting}
                    className="btn-primary text-lg px-10 py-4"
                  >
                    {selecting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                      <>Proceed with this plan <ChevronRight className="w-5 h-5" /></>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}
