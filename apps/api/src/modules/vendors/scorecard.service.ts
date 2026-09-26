import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";

export async function updateVendorScorecard(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      bookings: true,
      ratings: true,
    },
  });

  if (!vendor) return null;

  const totalBookings = vendor.bookings.length;
  const cancelledBookings = vendor.bookings.filter((b) => b.status === "CANCELLED" || b.status === "FAILED").length;
  const cancellationRate = totalBookings > 0 ? Number((cancelledBookings / totalBookings).toFixed(3)) : 0;

  // Average rating
  const avgRating =
    vendor.ratings.length > 0
      ? vendor.ratings.reduce((acc, r) => acc + r.rating, 0) / vendor.ratings.length
      : 0;

  // Compute composite trust score (1.0 to 5.0)
  const trustScore = Number((Math.max(1.0, Math.min(5.0, avgRating > 0 ? (avgRating * 0.7 + (1 - cancellationRate) * 5 * 0.3) : 4.0))).toFixed(1));

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      trustScore,
      totalBookings,
      disputeCount: cancelledBookings,
    },
  });

  const scorecard = await prisma.vendorScorecard.upsert({
    where: { vendorId },
    create: {
      vendorId,
      cancellationRate,
      avgResponseMins: 10,
    },
    update: {
      cancellationRate,
    },
  });

  logger.info({ vendorId, trustScore, cancellationRate }, "[VendorScorecard] Updated vendor metrics");
  return { scorecard, trustScore };
}
