import { prisma } from "../../../lib/prisma";
import { emitTripEvent } from "../../../ws/gateway";
import { logger } from "../../../lib/logger";
import type { CreateSplitPaymentInput } from "../payments.schema";

export async function createSplitPaymentGroup(input: CreateSplitPaymentInput) {
  // 1. Create root Payment record
  const payment = await prisma.payment.create({
    data: {
      tripId: input.tripId,
      amount: input.totalAmount,
      gateway: "razorpay_split",
      gatewayRefId: `split_${Date.now()}_${input.tripId.substring(0, 8)}`,
      status: "AUTHORIZED",
    },
  });

  // 2. Create individual traveler PaymentShares
  const shares = await Promise.all(
    input.splits.map(async (split) => {
      // In production, Razorpay Payment Links API is invoked here
      const mockPayLink = `https://rzp.io/l/split_${split.travelerId}_${input.tripId.substring(0, 6)}`;

      return prisma.paymentShare.create({
        data: {
          paymentId: payment.id,
          travelerId: split.travelerId,
          amount: split.amount,
          status: "PENDING",
          payLinkUrl: mockPayLink,
        },
      });
    })
  );

  logger.info({ tripId: input.tripId, paymentId: payment.id, splitCount: shares.length }, "[SplitPayment] Group splits created");

  emitTripEvent(input.tripId, {
    type: "SPLIT_PAYMENT_INITIATED",
    tripId: input.tripId,
    paymentId: payment.id,
    shares,
  });

  return { payment, shares };
}

export async function markSharePaid(shareId: string) {
  const share = await prisma.paymentShare.update({
    where: { id: shareId },
    data: { status: "PAID" },
    include: { payment: true },
  });

  // Check if all shares for this payment are PAID
  const allShares = await prisma.paymentShare.findMany({
    where: { paymentId: share.paymentId },
  });

  const allPaid = allShares.every((s) => s.status === "PAID");

  if (allPaid) {
    await prisma.payment.update({
      where: { id: share.paymentId },
      data: { status: "CAPTURED" },
    });

    emitTripEvent(share.payment.tripId, {
      type: "SPLIT_PAYMENT_ALL_PAID",
      tripId: share.payment.tripId,
      paymentId: share.paymentId,
    });
  } else {
    emitTripEvent(share.payment.tripId, {
      type: "SPLIT_PAYMENT_SHARE_PAID",
      tripId: share.payment.tripId,
      shareId,
      travelerId: share.travelerId,
    });
  }

  return { share, allPaid };
}

export async function getTripPaymentShares(tripId: string) {
  const payment = await prisma.payment.findFirst({
    where: { tripId },
    orderBy: { createdAt: "desc" },
    include: { shares: true },
  });

  return payment;
}
