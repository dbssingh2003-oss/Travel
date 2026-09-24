import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { runBookingSaga } from "./orchestrator/saga";
import { ManualVendorAdapter } from "./adapters/manual.adapter";
import type { InitiateBookingInput } from "./bookings.schema";
import type { BookingType } from "../../types/models";

const CONSENT_TOKEN_TTL = 600; // 10 minutes

// ── Consent ───────────────────────────────────────────────────────────────

export async function consentService(userId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      plans: { where: { selected: true } },
    },
  });
  if (!trip) throw Object.assign(new Error("Trip not found"), { statusCode: 404 });
  if (trip.status !== "PLANNED")
    throw Object.assign(new Error("Trip must be in PLANNED status to consent"), { statusCode: 400 });

  const selectedPlan = trip.plans[0];
  if (!selectedPlan)
    throw Object.assign(new Error("No plan selected"), { statusCode: 400 });

  const breakdown = (
    typeof selectedPlan.costBreakdown === "string"
      ? JSON.parse(selectedPlan.costBreakdown)
      : selectedPlan.costBreakdown
  ) as {
    transport: number;
    stay: number;
    localTransport: number;
    buffer: number;
  };

  const platformFee = Math.round(selectedPlan.estimatedCost * 0.03); // 3% platform fee
  const total = selectedPlan.estimatedCost + platformFee;

  const consentToken = `ct_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await redis.setex(
    `consent:${consentToken}`,
    CONSENT_TOKEN_TTL,
    JSON.stringify({ tripId, userId, total })
  );

  await prisma.auditLog.create({
    data: { tripId, actorId: userId, action: "CONSENT_GIVEN", detail: { total } },
  });

  return {
    tripId,
    itemizedPrice: {
      train: breakdown.transport,
      hotel: breakdown.stay,
      cab: breakdown.localTransport,
      buffer: breakdown.buffer,
      platformFee,
      total,
    },
    consentToken,
  };
}

// ── Initiate Booking ──────────────────────────────────────────────────────

export async function initiateBooking(userId: string, input: InitiateBookingInput) {
  // Validate consent token
  const consentRaw = await redis.get(`consent:${input.consentToken}`);
  if (!consentRaw)
    throw Object.assign(new Error("Consent token expired or invalid"), { statusCode: 400 });

  const consentData = JSON.parse(consentRaw) as { tripId: string; userId: string; total: number };
  if (consentData.tripId !== input.tripId || consentData.userId !== userId)
    throw Object.assign(new Error("Consent token mismatch"), { statusCode: 403 });

  await redis.del(`consent:${input.consentToken}`);

  const trip = await prisma.trip.findFirst({
    where: { id: input.tripId, userId },
    include: { plans: { where: { selected: true } } },
  });
  if (!trip) throw Object.assign(new Error("Trip not found"), { statusCode: 404 });

  const plan = trip.plans[0];
  if (!plan) throw Object.assign(new Error("No plan selected"), { statusCode: 400 });

  const breakdown = (
    typeof plan.costBreakdown === "string"
      ? JSON.parse(plan.costBreakdown)
      : plan.costBreakdown
  ) as {
    transport: number;
    stay: number;
    localTransport: number;
    buffer: number;
  };

  // Authorize payment (stub — real Razorpay integration hooks here)
  const gatewayRefId = `rzp_auth_${Date.now()}`;
  const payment = await prisma.payment.create({
    data: {
      tripId: trip.id,
      gateway: "razorpay",
      gatewayRefId,
      amount: consentData.total,
      status: "AUTHORIZED",
    },
  });

  await prisma.auditLog.create({
    data: { tripId: trip.id, actorId: userId, action: "PAYMENT_AUTHORIZED", detail: { amount: consentData.total } },
  });

  // Create pending bookings for each leg
  const legAmounts: Record<BookingType, number> = {
    TRAIN: breakdown.transport,
    HOTEL: breakdown.stay,
    CAB:   breakdown.localTransport,
  };

  const bookings: Record<BookingType, string> = {} as any;
  for (const [type, amount] of Object.entries(legAmounts) as [BookingType, number][]) {
    const booking = await prisma.booking.create({
      data: {
        tripId: trip.id,
        type,
        amount,
        status: "PENDING",
        metadata: {},
      },
    });
    bookings[type] = booking.id;
  }

  await prisma.trip.update({ where: { id: trip.id }, data: { status: "CONFIRMING" } });

  // Run saga asynchronously (fire and forget — WebSocket pushes updates)
  setImmediate(async () => {
    const steps = (["TRAIN", "HOTEL", "CAB"] as BookingType[]).map((type) => {
      const bookingId = bookings[type];
      const adapter = new ManualVendorAdapter(type, trip.id, bookingId, legAmounts[type]);
      return {
        name: type,
        execute: () => adapter.book(bookingId, []),
        compensate: () => adapter.cancel(`PENDING-${bookingId.slice(0, 8).toUpperCase()}`),
      };
    });

    await runBookingSaga(steps, trip.id);
  });

  return {
    tripId: trip.id,
    status: "CONFIRMING",
    trackingChannel: `wss://api.dbbestworlds.app/ws/trips/${trip.id}`,
  };
}

// ── Cancel Booking ────────────────────────────────────────────────────────

export async function cancelBooking(userId: string, bookingId: string, reason?: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
    include: { trip: true },
  });
  if (!booking || booking.trip.userId !== userId)
    throw Object.assign(new Error("Booking not found"), { statusCode: 404 });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", failureReason: reason },
  });

  await prisma.auditLog.create({
    data: {
      tripId: booking.tripId,
      actorId: userId,
      action: "BOOKING_CANCELLED",
      detail: { bookingId, reason },
    },
  });

  return { bookingId, status: "CANCELLED" };
}
