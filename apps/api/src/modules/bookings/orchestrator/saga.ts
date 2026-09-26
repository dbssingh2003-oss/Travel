/**
 * Booking Saga Coordinator (spec §11.1, §17.2, v2 Observability)
 *
 * Runs booking steps sequentially with distributed Redlock concurrency control.
 * On any failure:
 * - Compensates (cancels) all already-completed steps in reverse order
 * - Triggers payment refund
 * - Emits TRIP_FAILED via WebSocket
 * - Emits real-time saga observability events for audit & /ops timeline
 */
import { prisma } from "../../../lib/prisma";
import { emitTripEvent } from "../../../ws/gateway";
import { recordSagaEvent } from "./sagaLog";
import { acquireTripLock } from "../locking/redlock";
import type { BookingType } from "../../../types/models";

export type SagaStep = {
  name: BookingType;
  execute: () => Promise<{ status?: string; referenceCode: string; detail?: Record<string, any> }>;
  compensate: () => Promise<void>;
};

async function recordBooking(
  tripId: string,
  type: BookingType,
  status: "PENDING" | "CONFIRMED" | "WAITLISTED" | "RAC" | "CANCELLED" | "FAILED",
  referenceCode?: string
) {
  await prisma.booking.updateMany({
    where: { tripId, type },
    data: {
      status: status as any,
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

  await recordSagaEvent(tripId, "PAYMENT_REFUND", "SUCCEEDED", { reason: "Saga compensation rollback" });
  console.log(`[Saga] Payment refunded for trip ${tripId}`);
}

export async function runBookingSaga(
  steps: SagaStep[],
  tripId: string
): Promise<{ success: boolean; error?: unknown }> {
  // 1. Acquire distributed lock for idempotency
  const lock = await acquireTripLock(tripId, 45000);
  if (!lock) {
    console.warn(`[Saga] Could not acquire lock for trip ${tripId} — already processing`);
    return { success: false, error: new Error("Booking already in progress for this trip") };
  }

  const completed: SagaStep[] = [];

  try {
    await recordSagaEvent(tripId, "SAGA_INITIATED", "STARTED", { totalSteps: steps.length });
    let allConfirmed = true;

    for (const step of steps) {
      await recordSagaEvent(tripId, `${step.name}_BOOK_ATTEMPT`, "STARTED");

      const result = await step.execute();
      const status = (result.status as "PENDING" | "CONFIRMED" | "WAITLISTED" | "RAC") || "CONFIRMED";
      
      if (status !== "CONFIRMED") {
        allConfirmed = false;
      }

      await recordBooking(tripId, step.name, status, result.referenceCode);
      completed.push(step);

      await recordSagaEvent(tripId, `${step.name}_BOOK_ATTEMPT`, "SUCCEEDED", {
        status,
        referenceCode: result.referenceCode,
        detail: result.detail,
      });

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

      await recordSagaEvent(tripId, "TRIP_COMPLETED", "SUCCEEDED", { status: "BOOKED" });
      emitTripEvent(tripId, { type: "TRIP_COMPLETE", status: "BOOKED" });

      await prisma.auditLog.create({
        data: { tripId, actorId: "system", action: "TRIP_BOOKED" },
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error(`[Saga] Failure for trip ${tripId}:`, err);
    await recordSagaEvent(tripId, "SAGA_EXECUTION_FAILED", "FAILED", { error: err?.message || String(err) });

    // Compensate in reverse
    for (const step of completed.reverse()) {
      try {
        await recordSagaEvent(tripId, `${step.name}_COMPENSATE`, "STARTED");
        await step.compensate();
        await recordBooking(tripId, step.name, "CANCELLED");
        await recordSagaEvent(tripId, `${step.name}_COMPENSATE`, "COMPENSATED");
        emitTripEvent(tripId, { type: "BOOKING_UPDATE", leg: step.name, status: "CANCELLED" });
      } catch (compErr: any) {
        console.error(`[Saga] Compensation failed for ${step.name}:`, compErr);
        await recordSagaEvent(tripId, `${step.name}_COMPENSATE`, "FAILED", { error: compErr?.message });
      }
    }

    await refundPayment(tripId);

    await prisma.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED" },
    });

    emitTripEvent(tripId, { type: "TRIP_FAILED", status: "FAILED" });

    return { success: false, error: err };
  } finally {
    await lock.release();
  }
}
