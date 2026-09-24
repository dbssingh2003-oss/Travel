import { prisma } from "../../lib/prisma";
import type { BookingType } from "../../types/models";

export async function createVendor(input: {
  name: string;
  type: BookingType;
  contactPhone: string;
  contactEmail: string;
  city?: string;
}) {
  return prisma.vendor.create({ data: input });
}

export async function approveKyc(vendorId: string) {
  return prisma.vendor.update({
    where: { id: vendorId },
    data: { kycVerified: true, active: true },
  });
}

export async function listVendors(type?: BookingType, city?: string) {
  return prisma.vendor.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(city ? { city: { contains: city } } : {}),
      active: true,
    },
    orderBy: { trustScore: "desc" },
  });
}

export async function rateVendor(
  vendorId: string,
  bookingId: string,
  rating: number,
  comment?: string
) {
  const vendorRating = await prisma.vendorRating.create({
    data: { vendorId, bookingId, rating, comment },
  });

  // Recalculate trust score
  const stats = await prisma.vendorRating.aggregate({
    where: { vendorId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) return vendorRating;

  const onTimeRate = Math.max(
    0,
    1 - vendor.disputeCount / Math.max(1, vendor.totalBookings)
  );
  const avgRating = (stats._avg.rating ?? 0) / 5; // normalize to 0-1
  const trustScore = (onTimeRate * 0.6 + avgRating * 0.4) * 10; // 0-10

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { trustScore: Math.round(trustScore * 10) / 10 },
  });

  return vendorRating;
}
