import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Wallet, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useTripStore } from "@/store/tripStore";

const steps = ["Destination", "Dates", "Travelers & Budget", "Review"];

// Step schemas
const DestinationSchema = z.object({
  destination: z.string().min(2, "Enter destination (e.g. Manali, Himachal Pradesh)"),
  originCity: z.string().min(2, "Enter your origin city").optional(),
});

const DatesSchema = z.object({
  startDate: z.string().min(1, "Pick a start date"),
  endDate: z.string().min(1, "Pick an end date"),
});

const BudgetSchema = z.object({
  travelers: z.number().min(1).max(20),
  budgetTier: z.enum(["LOW", "MEDIUM", "HIGH", "CUSTOM"]),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
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
                  ? "bg-success text-white"
                  : i === current
                  ? "bg-primary text-white shadow-glow-primary"
                  : "bg-surface-2 text-muted-fg border border-border"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === current ? "text-primary font-medium" : "text-muted-fg"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}

function DestinationStep({ onNext }: { onNext: (data: any) => void }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(DestinationSchema),
  });

  const popular = ["Manali, HP", "Goa", "Rishikesh, UK", "Coorg, Karnataka", "Jaisalmer, RJ", "Andaman Islands"];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <MapPin className="w-4 h-4 inline mr-1 text-primary" />
          Where do you want to go?
        </label>
        <input
          {...register("destination")}
          placeholder="e.g. Manali, Himachal Pradesh"
          className="input-field"
        />
        {errors.destination && (
          <p className="text-danger text-sm mt-1">{errors.destination.message as string}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {popular.map((dest) => (
            <button
              key={dest}
              type="button"
              onClick={() => setValue("destination", dest, { shouldValidate: true })}
              className="badge badge-primary cursor-pointer hover:bg-primary/20 transition-colors"
            >
              {dest}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <MapPin className="w-4 h-4 inline mr-1 text-muted" />
          From which city? (optional)
        </label>
        <input
          {...register("originCity")}
          placeholder="e.g. Delhi, Mumbai"
          className="input-field"
        />
      </div>
      <button type="submit" className="btn-primary w-full">
        Next <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

function DatesStep({ onNext, onBack }: { onNext: (d: any) => void; onBack: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(DatesSchema) });
  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1 text-primary" /> From
          </label>
          <input type="date" min={today} {...register("startDate")} className="input-field" />
          {errors.startDate && <p className="text-danger text-sm mt-1">{errors.startDate.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1 text-primary" /> To
          </label>
          <input type="date" min={today} {...register("endDate")} className="input-field" />
          {errors.endDate && <p className="text-danger text-sm mt-1">{errors.endDate.message as string}</p>}
        </div>
      </div>
      <p className="text-xs text-muted-fg">💡 Weekday departures are usually cheaper. We'll highlight the best days.</p>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button type="submit" className="btn-primary flex-1">
          Next <ArrowRight className="w-4 h-4" />
        </button>
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
    { id: "LOW", label: "Budget", desc: "₹800–1,500/day", icon: "🎒" },
    { id: "MEDIUM", label: "Balanced", desc: "₹1,500–3,500/day", icon: "⚖️" },
    { id: "HIGH", label: "Comfort", desc: "₹3,500+/day", icon: "✨" },
    { id: "CUSTOM", label: "Custom", desc: "Set your own range", icon: "🎯" },
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Users className="w-4 h-4 inline mr-1 text-primary" /> Number of travelers
        </label>
        <input
          type="number"
          min={1}
          max={20}
          {...register("travelers", { valueAsNumber: true })}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          <Wallet className="w-4 h-4 inline mr-1 text-primary" /> Budget preference
        </label>
        <div className="grid grid-cols-2 gap-3">
          {tiers.map((t) => (
            <label
              key={t.id}
              className={`relative flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                tier === t.id
                  ? "border-primary bg-primary/10 shadow-glow-primary"
                  : "border-border bg-surface-2 hover:border-primary/40"
              }`}
            >
              <input type="radio" value={t.id} {...register("budgetTier")} className="sr-only" />
              <span className="text-2xl">{t.icon}</span>
              <span className="font-semibold text-slate-100">{t.label}</span>
              <span className="text-xs text-muted-fg">{t.desc}</span>
            </label>
          ))}
        </div>
      </div>
      {tier === "CUSTOM" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-fg mb-1">Min budget (₹)</label>
            <input type="number" {...(register as any)("budgetMin", { valueAsNumber: true })} placeholder="10000" className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-muted-fg mb-1">Max budget (₹)</label>
            <input type="number" {...(register as any)("budgetMax", { valueAsNumber: true })} placeholder="30000" className="input-field" />
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button type="submit" className="btn-primary flex-1">
          Next <ArrowRight className="w-4 h-4" />
        </button>
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
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-semibold text-slate-200">Trip Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-fg">Destination</span>
            <p className="font-medium text-slate-100">{data.destination}</p>
          </div>
          {data.originCity && (
            <div>
              <span className="text-muted-fg">From</span>
              <p className="font-medium text-slate-100">{data.originCity}</p>
            </div>
          )}
          <div>
            <span className="text-muted-fg">Travel Dates</span>
            <p className="font-medium text-slate-100">{data.startDate} → {data.endDate}</p>
          </div>
          <div>
            <span className="text-muted-fg">Travelers</span>
            <p className="font-medium text-slate-100">{data.travelers} person{data.travelers > 1 ? "s" : ""}</p>
          </div>
          <div>
            <span className="text-muted-fg">Budget</span>
            <p className="font-medium text-slate-100">{data.budgetTier}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onSubmit} disabled={loading} className="btn-primary flex-1">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <>Generate Plans <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}

export function PlannerWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentTrip } = useTripStore();

  const merge = (data: any) => setFormData((prev) => ({ ...prev, ...data }));

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const tripRes = await api.post("/trips", formData);
      const tripId = tripRes.data.tripId;
      setCurrentTrip(tripId);
      navigate(`/trips/${tripId}/plans`);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepComponents = [
    <DestinationStep onNext={(d) => { merge(d); setStep(1); }} />,
    <DatesStep onNext={(d) => { merge(d); setStep(2); }} onBack={() => setStep(0)} />,
    <BudgetStep onNext={(d) => { merge(d); setStep(3); }} onBack={() => setStep(1)} />,
    <ReviewStep data={formData} onSubmit={handleFinalSubmit} onBack={() => setStep(2)} loading={loading} />,
  ];

  return (
    <div className="max-w-lg mx-auto">
      <StepProgress current={step} total={steps.length} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {stepComponents[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
