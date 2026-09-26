import { prisma } from "../../../lib/prisma";
import { recordSagaEvent } from "./sagaLog";
import { emitTripEvent } from "../../../ws/gateway";
import { logger } from "../../../lib/logger";
import type { BookingType } from "../../../types/models";

export interface ModificationRequest {
  tripId: string;
  bookingId: string;
  type: BookingType;
  newMetadata?: Record<string, any>;
  costDifference?: number;
}

/**
 * Mini-saga for partial post-booking modification of a single leg
 */
export async function runModificationSaga(req: ModificationRequest) {
  const { tripId, bookingId, type, newMetadata, costDifference = 0 } = req;

  await recordSagaEvent(tripId, `MODIFICATION_${type}`, "STARTED", { bookingId, newMetadata });

  try {
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking || existingBooking.tripId !== tripId) {
      throw new Error("Booking leg not found for this trip");
    }

    // 1. Rebook/update the specific leg
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        metadata: {
          ...(typeof existingBooking.metadata === "object" ? (existingBooking.metadata as any) : {}),
          ...newMetadata,
          modifiedAt: new Date().toISOString(),
        },
        amount: existingBooking.amount + costDifference,
      },
    });

    // 2. Audit log
    await prisma.auditLog.create({
      data: {
        tripId,
        actorId: "system:modification",
        action: `LEG_MODIFIED_${type}`,
        detail: { bookingId, newMetadata, costDifference },
      },
    });

    // 3. Emit real-time notification
    emitTripEvent(tripId, {
      type: "BOOKING_UPDATE",
      tripId,
      bookingId,
      leg: type,
      status: updated.status,
      metadata: updated.metadata,
    });

    await recordSagaEvent(tripId, `MODIFICATION_${type}`, "SUCCEEDED", { bookingId, updatedAmount: updated.amount });

    logger.info({ tripId, bookingId, type }, "[ModificationSaga] Single-leg modified successfully");
    return { success: true, booking: updated };
  } catch (err: any) {
    logger.error({ err: err.message, tripId, bookingId }, "[ModificationSaga] Failed to modify single leg");
    await recordSagaEvent(tripId, `MODIFICATION_${type}`, "FAILED", { error: err.message });
    return { success: false, error: err.message };
  }
}
