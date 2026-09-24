import { motion } from "framer-motion";
import { PlannerWizard } from "@/components/planner/PlannerWizard";
import { MapPin } from "lucide-react";

export default function PlannerPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-32 right-10 w-64 h-64 bg-accent/6 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
      </div>

      <div className="section max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 badge badge-primary mb-4">
            <MapPin className="w-3 h-3" /> Plan a new trip
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Where are you <span className="gradient-text">headed?</span>
          </h1>
          <p className="text-muted text-sm">
            Tell us the basics and we'll generate 3 tailored trip plans in seconds.
          </p>
        </motion.div>

        <div className="glass-card p-8">
          <PlannerWizard />
        </div>
      </div>
    </motion.div>
  );
}
