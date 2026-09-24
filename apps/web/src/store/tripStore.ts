import { create } from "zustand";

interface CostBreakdown {
  transport: number;
  stay: number;
  localTransport: number;
  buffer: number;
}

interface Plan {
  id: string;
  label: string;
  estimatedCost: number;
  costBreakdown: CostBreakdown;
  itinerary: Array<{ day: number; title: string; activities: string[] }>;
}

interface TripState {
  currentTripId: string | null;
  selectedPlan: Plan | null;
  consentData: {
    itemizedPrice: Record<string, number>;
    consentToken: string;
  } | null;
  setCurrentTrip: (id: string) => void;
  setSelectedPlan: (plan: Plan) => void;
  setConsentData: (data: TripState["consentData"]) => void;
  reset: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentTripId: null,
  selectedPlan: null,
  consentData: null,
  setCurrentTrip: (id) => set({ currentTripId: id }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  setConsentData: (data) => set({ consentData: data }),
  reset: () => set({ currentTripId: null, selectedPlan: null, consentData: null }),
}));
