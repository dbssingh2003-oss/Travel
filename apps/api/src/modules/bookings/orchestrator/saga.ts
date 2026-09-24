/**
 * Booking Saga Coordinator (spec §11.1, §17.2)
 *
 * Runs booking steps sequentially. On any failure:
 * - Compensates (cancels) all already-completed steps in reverse order
 * - Triggers payment refund
 * - Emits TRIP_FAILED via WebSocket
 */
import { prisma } from "../../../lib/prisma";
import { emitTripEvent } from "../../../ws/gateway";
import type { BookingType } from "../../../types/models";

export type SagaStep = {
  name: BookingType;
  execute: () => Promise<{ status?: string; referenceCode: string }>;
  compensate: () => Promise<void>;
};

async function recordBooking(
  tripId: string,
  type: BookingType,
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED",
  referenceCode?: string
) {
  await prisma.booking.updateMany({
    where: { tripId, type },
    data: {
      status,
      ...(referenceCode ? { referenceCode } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      tripId,
      actorId: "system",
      action: `BOOKING_${status}`,
      detail: { type, referenceCode },
    },
  });
}

async function refundPayment(tripId: string) {
  await prisma.payment.updateMany({
    where: { tripId, status: { in: ["AUTHORIZED", "CAPTURED"] } },
    data: { status: "REFUNDED" },
  });

  await prisma.auditLog.create({
    data: { tripId, actorId: "system", action: "PAYMENT_REFUNDED" },
  });

  // TODO: call Razorpay refund API here
  console.log(`[Saga] Payment refunded for trip ${tripId}`);
}

export async function runBookingSaga(
  steps: SagaStep[],
  tripId: string
): Promise<{ success: boolean; error?: unknown }> {
  const completed: SagaStep[] = [];

  try {
    let allConfirmed = true;
    for (const step of steps) {
      const result = await step.execute();
      const status = (result.status as "PENDING" | "CONFIRMED") || "CONFIRMED";
      if (status !== "CONFIRMED") {
        allConfirmed = false;
      }
      await recordBooking(tripId, step.name, status, result.referenceCode);
      completed.push(step);
      emitTripEvent(tripId, {
        type: "BOOKING_UPDATE",
        leg: step.name,
        status,
        referenceCode: result.referenceCode,
      });
    }

    // Only if all legs are confirmed immediately (e.g. automated APIs)
    if (allConfirmed) {
      await prisma.payment.updateMany({
        where: { tripId, status: "AUTHORIZED" },
        data: { status: "CAPTURED" },
      });

      await prisma.trip.update({
        where: { id: tripId },
        data: { status: "BOOKED" },
      });

      emitTripEvent(tripId, { type: "TRIP_COMPLETE", status: "BOOKED" });

      await prisma.auditLog.create({
        data: { tripId, actorId: "system", action: "TRIP_BOOKED" },
      });
    }

    return { success: true };
  } catch (err) {
    console.error(`[Saga] Failure for trip ${tripId}:`, err);

    // Compensate in reverse
    for (const step of completed.reverse()) {
      try {
        await step.compensate();
        await recordBooking(tripId, step.name, "CANCELLED");
        emitTripEvent(tripId, { type: "BOOKING_UPDATE", leg: step.name, status: "CANCELLED" });
      } catch (compErr) {
        console.error(`[Saga] Compensation failed for ${step.name}:`, compErr);
      }
    }

    await refundPayment(tripId);

    await prisma.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED" },
    });

    emitTripEvent(tripId, { type: "TRIP_FAILED", status: "FAILED" });

    return { success: false, error: err };
  }
}
