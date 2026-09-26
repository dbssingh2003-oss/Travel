import { prisma } from "../../../lib/prisma";
import { emitTripEvent } from "../../../ws/gateway";
import type { CreateTripLegInput, UpdateTripLegInput } from "./legs.schema";

export async function createTripLeg(input: CreateTripLegInput) {
  const leg = await prisma.tripLeg.create({
    data: {
      tripId: input.tripId,
      sequence: input.sequence,
      originCity: input.originCity,
      destination: input.destination,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    },
  });

  return leg;
}

export async function getTripLegs(tripId: string) {
  return prisma.tripLeg.findMany({
    where: { tripId },
    orderBy: { sequence: "asc" },
    include: { bookings: true },
  });
}

export async function updateTripLeg(id: string, input: UpdateTripLegInput) {
  return prisma.tripLeg.update({
    where: { id },
    data: {
      ...(input.sequence ? { sequence: input.sequence } : {}),
      ...(input.originCity ? { originCity: input.originCity } : {}),
      ...(input.destination ? { destination: input.destination } : {}),
      ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
      ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
    },
  });
}

export async function deleteTripLeg(id: string) {
  return prisma.tripLeg.delete({
    where: { id },
  });
}

export function notifyLegConfirmed(tripId: string, legId: string, type: string, referenceCode: string) {
  emitTripEvent(tripId, {
    type: `trip:${tripId}:leg:confirmed`,
    tripId,
    legId,
    bookingType: type,
    referenceCode,
    timestamp: new Date().toISOString(),
  });
}
