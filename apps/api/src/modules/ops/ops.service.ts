import { prisma } from "../../lib/prisma";
import { emitTripEvent } from "../../ws/gateway";
import { sendNotification } from "../notifications/notification.service";

export async function getPendingBookings(type?: string, city?: string) {
  return prisma.booking.findMany({
    where: {
      status: "PENDING",
      ...(type ? { type: type as any } : {}),
    },
    include: {
      trip: {
        select: {
          destination: true,
          startDate: true,
          travelers: true,
          user: { select: { name: true, phone: true, email: true } },
        },
      },
      vendor: { select: { name: true, city: true } },
    },
    orderBy: { slaDeadline: "asc" },
  });
}

export async function claimBooking(bookingId: string, agentId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
  if (booking.claimedByUserId)
    throw Object.assign(new Error("Booking already claimed"), { statusCode: 409 });

  return prisma.booking.update({
    where: { id: bookingId },
    data: { claimedByUserId: agentId },
  });
}

export async function confirmBooking(bookingId: string, referenceCode: string, agentId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: { include: { user: true } } },
  });
  if (!booking) throw Object.assign(new Error("Booking not found"), { statusCode: 404 });

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED", referenceCode },
  });

  await prisma.auditLog.create({
    data: {
      tripId: booking.tripId,
      actorId: agentId,
      action: "OPS_BOOKING_CONFIRMED",
      detail: { bookingId, referenceCode },
    },
  });

  // Push WebSocket update to user
  emitTripEvent(booking.tripId, {
    type: "BOOKING_UPDATE",
    leg: booking.type,
    status: "CONFIRMED",
    referenceCode,
  });

  // Check if all bookings confirmed → mark trip BOOKED
  const remaining = await prisma.booking.count({
    where: { tripId: booking.tripId, status: { not: "CONFIRMED" } },
  });

  if (remaining === 0) {
    await prisma.payment.updateMany({
      where: { tripId: booking.tripId, status: "AUTHORIZED" },
      data: { status: "CAPTURED" },
    });
    await prisma.trip.update({ where: { id: booking.tripId }, data: { status: "BOOKED" } });
    emitTripEvent(booking.tripId, { type: "TRIP_COMPLETE", status: "BOOKED" });

    // Send confirmation notification
    if (booking.trip.user.email) {
      await sendNotification({
        to: booking.trip.user.email,
        subject: "Your trip is confirmed! 🎉",
        body: `All bookings for your trip to ${booking.trip.destination} are confirmed.`,
        channel: "email",
      });
    }
  }

  return updated;
}

export async function failBooking(bookingId: string, reason: string, agentId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw Object.assign(new Error("Booking not found"), { statusCode: 404 });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "FAILED", failureReason: reason },
  });

  await prisma.auditLog.create({
    data: {
      tripId: booking.tripId,
      actorId: agentId,
      action: "OPS_BOOKING_FAILED",
      detail: { bookingId, reason },
    },
  });

  emitTripEvent(booking.tripId, {
    type: "BOOKING_UPDATE",
    leg: booking.type,
    status: "FAILED",
    reason,
  });

  // Trigger saga compensation (refund + cancel other legs)
  await prisma.booking.updateMany({
    where: {
      tripId: booking.tripId,
      id: { not: bookingId },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    data: { status: "CANCELLED" },
  });

  await prisma.payment.updateMany({
    where: { tripId: booking.tripId, status: { in: ["AUTHORIZED", "CAPTURED"] } },
    data: { status: "REFUNDED" },
  });

  await prisma.trip.update({ where: { id: booking.tripId }, data: { status: "CANCELLED" } });

  emitTripEvent(booking.tripId, { type: "TRIP_FAILED", status: "CANCELLED" });

  return { bookingId, status: "FAILED" };
}
