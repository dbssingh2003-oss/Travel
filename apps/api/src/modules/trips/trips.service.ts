import { prisma } from "../../lib/prisma";
import type { CreateTripInput } from "./trips.schema";
import type { BudgetTier } from "../../types/models";
import { NotFoundError, UnauthorizedError, BadRequestError } from "../../lib/errors";
import { logger } from "../../lib/logger";

// ── Budget bands (INR per traveler, per night/segment) ────────────────────
const BUDGET_BANDS: Record<BudgetTier, { trainBase: number; hotelNight: number; cab: number; buffer: number }> = {
  LOW:    { trainBase: 600,  hotelNight: 800,  cab: 500,  buffer: 1000 },
  MEDIUM: { trainBase: 1200, hotelNight: 1800, cab: 1000, buffer: 2000 },
  HIGH:   { trainBase: 2500, hotelNight: 4000, cab: 2000, buffer: 4000 },
  CUSTOM: { trainBase: 1200, hotelNight: 1800, cab: 1000, buffer: 2000 },
};

// ── Mock itinerary templates ──────────────────────────────────────────────
function generateItinerary(destination: string, nights: number, tier: string) {
  const days = [];
  const dest = destination.split(",")[0].trim();

  days.push({
    day: 1,
    title: `Arrival & Explore ${dest}`,
    activities: [
      `Overnight train / bus to ${dest}`,
      `Check-in to hotel`,
      `Evening walk through local market`,
    ],
  });

  for (let d = 2; d <= nights; d++) {
    days.push({
      day: d,
      title: d === nights ? `Last Day & Departure` : `Day ${d} — ${dest} Highlights`,
      activities:
        d === nights
          ? ["Check-out", "Local sightseeing", "Head back home"]
          : [
              `Sightseeing at popular spots in ${dest}`,
              `Local cuisine lunch & relaxation`,
              `Afternoon adventure & scenic views`,
              `Evening leisure & dinner`,
            ],
    });
  }

  if (nights < 2) {
    days.push({ day: 2, title: "Return Journey", activities: ["Check-out", "Cab to station", "Return home"] });
  }

  return days;
}

// ── Plan generator ────────────────────────────────────────────────────────
function generatePlans(trip: CreateTripInput) {
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const travelers = trip.travelers || 1;
  const dest = trip.destination.split(",")[0].trim();

  const tiers: Array<{ tier: BudgetTier; label: string; multiplier: number }> = [
    { tier: "LOW",    label: "Budget Explorer",  multiplier: 1.0 },
    { tier: "MEDIUM", label: "Balanced",          multiplier: 1.4 },
    { tier: "HIGH",   label: "Comfort Plus",      multiplier: 2.2 },
  ];

  // If CUSTOM budget, derive a multiplier from the range
  const effectiveTier: BudgetTier =
    trip.budgetTier === "CUSTOM" || !BUDGET_BANDS[trip.budgetTier as BudgetTier]
      ? "MEDIUM"
      : (trip.budgetTier as BudgetTier);

  return tiers.map(({ tier, label, multiplier }) => {
    const band = BUDGET_BANDS[effectiveTier];
    const transport  = Math.round(band.trainBase * travelers * multiplier);
    const stay       = Math.round(band.hotelNight * nights * travelers * multiplier);
    const localTransport = Math.round(band.cab * nights * multiplier);
    const buffer     = Math.round(band.buffer * travelers * multiplier);
    const estimatedCost = transport + stay + localTransport + buffer;

    return {
      label,
      estimatedCost,
      costBreakdown: { transport, stay, localTransport, buffer },
      itineraryJson: generateItinerary(dest, nights, tier),
    };
  });
}

// ── Service functions ─────────────────────────────────────────────────────

export async function createTrip(userId: string, input: CreateTripInput) {
  // Ensure the user exists in database to prevent foreign key errors
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UnauthorizedError("User session is invalid. Please sign in again.");
  }

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new BadRequestError("Invalid travel dates provided.");
  }

  const trip = await prisma.trip.create({
    data: {
      userId,
      destination: input.destination,
      originCity: input.originCity,
      startDate,
      endDate,
      travelers: input.travelers ?? 1,
      budgetTier: input.budgetTier as BudgetTier,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      status: "DRAFT",
    },
  });

  try {
    await prisma.auditLog.create({
      data: { tripId: trip.id, actorId: userId, action: "TRIP_CREATED" },
    });
  } catch (err) {
    logger.warn({ err }, "Could not write audit log for trip creation");
  }

  return { tripId: trip.id, status: trip.status };
}

export async function getPlansForTrip(userId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: { plans: true },
  });

  if (!trip) {
    throw new NotFoundError("Trip not found or you do not have permission to view it.");
  }

  if (trip.plans.length === 0) {
    return generatePlansForTrip(userId, tripId);
  }

  return {
    tripId,
    plans: trip.plans.map((p) => ({
      id: p.id,
      label: p.label,
      estimatedCost: p.estimatedCost,
      costBreakdown: typeof p.costBreakdown === "string" ? JSON.parse(p.costBreakdown) : p.costBreakdown,
      itinerary: typeof p.itineraryJson === "string" ? JSON.parse(p.itineraryJson) : p.itineraryJson,
      selected: p.selected,
    })),
  };
}

export async function generatePlansForTrip(userId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    throw new NotFoundError("Trip not found or you do not have permission to access it.");
  }

  // Delete any previously generated plans for this trip
  await prisma.tripPlan.deleteMany({ where: { tripId } });

  const plans = generatePlans({
    destination: trip.destination,
    originCity: trip.originCity ?? undefined,
    startDate: trip.startDate.toISOString().split("T")[0],
    endDate: trip.endDate.toISOString().split("T")[0],
    travelers: trip.travelers,
    budgetTier: trip.budgetTier,
    budgetMin: trip.budgetMin ?? undefined,
    budgetMax: trip.budgetMax ?? undefined,
  });

  const created = await prisma.$transaction(
    plans.map((p) =>
      prisma.tripPlan.create({
        data: {
          tripId,
          label: p.label,
          estimatedCost: p.estimatedCost,
          costBreakdown: p.costBreakdown as any,
          itineraryJson: p.itineraryJson as any,
        },
      })
    )
  );

  try {
    await prisma.auditLog.create({
      data: { tripId, actorId: userId, action: "PLAN_GENERATED", detail: { count: plans.length } },
    });
  } catch (err) {
    logger.warn({ err }, "Could not write audit log for plan generation");
  }

  return {
    tripId,
    plans: created.map((p) => ({
      id: p.id,
      label: p.label,
      estimatedCost: p.estimatedCost,
      costBreakdown: typeof p.costBreakdown === "string" ? JSON.parse(p.costBreakdown) : p.costBreakdown,
      itinerary: typeof p.itineraryJson === "string" ? JSON.parse(p.itineraryJson) : p.itineraryJson,
      selected: p.selected,
    })),
  };
}

export async function selectPlan(userId: string, tripId: string, planId: string) {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) {
    throw new NotFoundError("Trip not found.");
  }

  const plan = await prisma.tripPlan.findFirst({ where: { id: planId, tripId } });
  if (!plan) {
    throw new NotFoundError("Selected plan not found for this trip.");
  }

  await prisma.$transaction([
    prisma.tripPlan.updateMany({ where: { tripId }, data: { selected: false } }),
    prisma.tripPlan.update({ where: { id: planId }, data: { selected: true } }),
    prisma.trip.update({ where: { id: tripId }, data: { status: "PLANNED" } }),
  ]);

  try {
    await prisma.auditLog.create({
      data: { tripId, actorId: userId, action: "PLAN_SELECTED", detail: { planId } },
    });
  } catch (err) {
    logger.warn({ err }, "Could not write audit log for plan selection");
  }

  return { tripId, status: "PLANNED", finalEstimate: plan.estimatedCost };
}

export async function getTripStatus(userId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      bookings: { select: { id: true, type: true, status: true, referenceCode: true } },
    },
  });
  if (!trip) {
    throw new NotFoundError("Trip not found.");
  }
  return trip;
}

export async function getTripConfirmation(userId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      bookings: {
        include: { vendor: { select: { name: true, contactPhone: true } } },
      },
      payments: { select: { amount: true, status: true } },
    },
  });
  if (!trip) {
    throw new NotFoundError("Trip not found.");
  }

  const totalPaid = trip.payments
    .filter((p) => p.status === "CAPTURED")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    tripId: trip.id,
    trip: {
      destination: trip.destination,
      originCity: trip.originCity,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers,
      status: trip.status,
    },
    bookings: trip.bookings,
    totalPaid,
    confirmedAt: trip.updatedAt,
  };
}

export async function getUserTrips(userId: string) {
  const trips = await prisma.trip.findMany({
    where: { userId },
    include: {
      plans: { where: { selected: true } },
      bookings: { select: { id: true, type: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return trips;
}
