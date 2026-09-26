import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Calendar, Users, Wallet, ArrowRight, ArrowLeft, Loader2, Sparkles, Layers } from "lucide-react";
import { tripsApi } from "@/lib/apiService";
import { useTripStore } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MultiLegStep, TripLegInput } from "@/components/planner/steps/MultiLegStep";

const steps = ["Destination", "Dates", "Multi-Stop", "Travelers & Budget", "Review"];

// Step schemas
const DestinationSchema = z.object({
  destination: z.string().min(2, "Enter destination (e.g. Manali, Himachal Pradesh)"),
  originCity: z.string().min(2, "Enter your origin city").optional(),
});

const DatesSchema = z.object({
  startDate: z.string().min(1, "Pick a start date"),
  endDate: z.string().min(1, "Pick an end date"),
});

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {steps.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                i < current
                  ? "bg-success-500 text-white"
                  : i === current
                  ? "bg-brand-500 text-white shadow-glow-brand"
                  : "bg-surface-hover text-muted-fg border border-surface-border"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === current ? "text-brand-500 font-semibold" : "text-muted-fg"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all duration-300 rounded-full"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function DestinationStep({ onNext }: { onNext: (data: any) => void }) {
  const [searchParams] = useSearchParams();
  const prefillDest = searchParams.get("dest") || "";

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(DestinationSchema),
    defaultValues: {
      destination: prefillDest,
      originCity: searchParams.get("from") || "",
    },
  });

  const popular = ["Manali, HP", "Goa", "Rishikesh, UK", "Coorg, Karnataka", "Jaisalmer, RJ", "Andaman Islands", "Ladakh, J&K", "Munnar, Kerala"];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <Card variant="default" className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-text-main mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-500" />
            Where do you want to go?
          </label>
          <input
            {...register("destination")}
            placeholder="e.g. Manali, Himachal Pradesh"
            className="w-full p-3 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errors.destination && (
            <p className="text-danger-500 text-xs mt-1.5 font-medium">{errors.destination.message as string}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3.5">
            {popular.map((dest) => (
              <button
                key={dest}
                type="button"
                onClick={() => setValue("destination", dest, { shouldValidate: true })}
                className="text-xs px-2.5 py-1 rounded-pill bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
              >
                {dest}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-main mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-muted-fg" />
            From which city? (optional)
          </label>
          <input
            {...register("originCity")}
            placeholder="e.g. New Delhi, Mumbai, Bengaluru"
            className="w-full p-3 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </Card>

      <Button type="submit" variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
        Continue to Dates
      </Button>
    </form>
  );
}

function DatesStep({ onNext, onBack }: { onNext: (d: any) => void; onBack: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(DatesSchema) });
  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <Card variant="default" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-500" /> Start Date
            </label>
            <input
              type="date"
              min={today}
              {...register("startDate")}
              className="w-full p-3 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.startDate && <p className="text-danger-500 text-xs mt-1.5 font-medium">{errors.startDate.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-500" /> End Date
            </label>
            <input
              type="date"
              min={today}
              {...register("endDate")}
              className="w-full p-3 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.endDate && <p className="text-danger-500 text-xs mt-1.5 font-medium">{errors.endDate.message as string}</p>}
          </div>
        </div>
        <p className="text-xs text-muted-fg">💡 Weekday departures often have higher IRCTC seat confirmation probabilities.</p>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onBack} className="flex-1" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button type="submit" variant="primary" size="lg" className="flex-1" rightIcon={<ArrowRight className="w-4 h-4" />}>
          Next
        </Button>
      </div>
    </form>
  );
}

function BudgetStep({ onNext, onBack }: { onNext: (d: any) => void; onBack: () => void }) {
  const { register, handleSubmit, watch } = useForm<{
    travelers: number;
    budgetTier: string;
    budgetMin?: number;
    budgetMax?: number;
  }>({
    defaultValues: { travelers: 1, budgetTier: "MEDIUM" },
  });
  const tier = watch("budgetTier");

  const tiers = [
    { id: "LOW", label: "Budget Explorer", desc: "Sleeper/3AC + budget stays", icon: "🎒" },
    { id: "MEDIUM", label: "Balanced", desc: "3AC/2AC + 3-star hotels + cabs", icon: "⚖️" },
    { id: "HIGH", label: "Comfort Plus", desc: "1AC/2AC + 4/5-star stays + private car", icon: "✨" },
    { id: "CUSTOM", label: "Custom Budget", desc: "Set custom price window", icon: "🎯" },
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <Card variant="default" className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-text-main mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-500" /> Number of Travelers
          </label>
          <input
            type="number"
            min={1}
            max={20}
            {...register("travelers", { valueAsNumber: true })}
            className="w-full p-3 text-sm bg-surface-hover/50 border border-surface-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-main mb-3 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-brand-500" /> Choose Budget Tier
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tiers.map((t) => (
              <label
                key={t.id}
                className={`relative flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  tier === t.id
                    ? "border-brand-500 bg-brand-500/10 shadow-glow-brand"
                    : "border-surface-border bg-surface-hover/50 hover:border-brand-500/40"
                }`}
              >
                <input type="radio" value={t.id} {...register("budgetTier")} className="sr-only" />
                <span className="text-2xl">{t.icon}</span>
                <span className="font-semibold text-text-main text-sm">{t.label}</span>
                <span className="text-xs text-muted-fg">{t.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {tier === "CUSTOM" && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs text-muted-fg mb-1 font-semibold">Min budget (₹)</label>
              <input
                type="number"
                {...(register as any)("budgetMin", { valueAsNumber: true })}
                placeholder="10000"
                className="w-full p-2.5 text-sm bg-surface-hover border border-surface-border rounded-lg text-text-main"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-fg mb-1 font-semibold">Max budget (₹)</label>
              <input
                type="number"
                {...(register as any)("budgetMax", { valueAsNumber: true })}
                placeholder="30000"
                className="w-full p-2.5 text-sm bg-surface-hover border border-surface-border rounded-lg text-text-main"
              />
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onBack} className="flex-1" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button type="submit" variant="primary" size="lg" className="flex-1" rightIcon={<ArrowRight className="w-4 h-4" />}>
          Review Plan
        </Button>
      </div>
    </form>
  );
}

function ReviewStep({
  data,
  onSubmit,
  onBack,
  loading,
}: {
  data: any;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card variant="default" className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h3 className="font-bold text-base text-text-main flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            Trip Planning Summary
          </h3>
          <Badge variant="brand" size="sm">Pre-Flight Review</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-muted-fg font-medium">Destination</span>
            <p className="font-semibold text-text-main">{data.destination}</p>
          </div>
          {data.originCity && (
            <div>
              <span className="text-xs text-muted-fg font-medium">Origin City</span>
              <p className="font-semibold text-text-main">{data.originCity}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-muted-fg font-medium">Dates</span>
            <p className="font-semibold text-text-main">{data.startDate} → {data.endDate}</p>
          </div>
          <div>
            <span className="text-xs text-muted-fg font-medium">Travelers</span>
            <p className="font-semibold text-text-main">{data.travelers} Person{data.travelers > 1 ? "s" : ""}</p>
          </div>
          <div>
            <span className="text-xs text-muted-fg font-medium">Budget Tier</span>
            <p className="font-semibold text-text-main">{data.budgetTier}</p>
          </div>
          {data.legs && data.legs.length > 1 && (
            <div>
              <span className="text-xs text-muted-fg font-medium">Multi-Leg Stops</span>
              <p className="font-semibold text-text-main">{data.legs.length} Segments Configured</p>
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onBack} disabled={loading} className="flex-1" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button variant="primary" size="lg" onClick={onSubmit} isLoading={loading} className="flex-1" rightIcon={<ArrowRight className="w-4 h-4" />}>
          Generate Plans
        </Button>
      </div>
    </div>
  );
}

export function PlannerWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [legs, setLegs] = useState<TripLegInput[]>([]);
  const navigate = useNavigate();
  const { setCurrentTrip } = useTripStore();
  const { addToast } = useUIStore();

  const merge = (data: any) => setFormData((prev) => ({ ...prev, ...data }));

  const handleDatesNext = (datesData: any) => {
    merge(datesData);
    if (legs.length === 0) {
      setLegs([
        {
          sequence: 1,
          originCity: formData.originCity || "New Delhi",
          destination: formData.destination || "Manali",
          startDate: datesData.startDate,
          endDate: datesData.endDate,
        },
      ]);
    }
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        legs: legs.length > 0 ? legs : undefined,
      };
      const res = await tripsApi.createTrip(payload);
      const tripId = res?.tripId || (res as any)?.id;
      if (!tripId) {
        throw new Error("Unable to retrieve trip ID from server");
      }
      setCurrentTrip(tripId);
      addToast({
        type: "success",
        title: "Itinerary Generated",
        message: "Your tiered plans have been prepared with live pricing!",
      });
      navigate(`/trips/${tripId}/plans`);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Planning Failed",
        message: err.message || "Failed to create trip. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const stepComponents = [
    <DestinationStep onNext={(d) => { merge(d); setStep(1); }} />,
    <DatesStep onNext={handleDatesNext} onBack={() => setStep(0)} />,
    <MultiLegStep
      legs={legs}
      onChange={setLegs}
      onNext={() => { merge({ legs }); setStep(3); }}
      onBack={() => setStep(1)}
    />,
    <BudgetStep onNext={(d) => { merge(d); setStep(4); }} onBack={() => setStep(2)} />,
    <ReviewStep data={{ ...formData, legs }} onSubmit={handleFinalSubmit} onBack={() => setStep(3)} loading={loading} />,
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <StepProgress current={step} total={steps.length} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {stepComponents[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default PlannerWizard;
