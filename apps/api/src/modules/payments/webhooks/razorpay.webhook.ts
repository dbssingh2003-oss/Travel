import { createHmac } from "crypto";
import { prisma } from "../../../lib/prisma";
import { markSharePaid } from "../split/splitPayment.service";
import { logger } from "../../../lib/logger";

export async function handleRazorpayWebhook(
  signature: string,
  rawBody: string,
  eventData: any
) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "default_webhook_secret";

  // Signature verification
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (process.env.NODE_ENV === "production" && signature !== expectedSignature) {
    throw new Error("Invalid Razorpay webhook signature");
  }

  const eventId = eventData?.id || `evt_${Date.now()}`;
  
  // Idempotency check
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { key: `webhook:razorpay:${eventId}` },
  });

  if (existingKey) {
    logger.info({ eventId }, "[RazorpayWebhook] Duplicate event ignored (idempotent)");
    return { status: "ignored", reason: "duplicate" };
  }

  // Record idempotency key
  await prisma.idempotencyKey.create({
    data: {
      key: `webhook:razorpay:${eventId}`,
      scope: "razorpay:webhook",
      response: eventData,
    },
  });

  // Handle specific webhook event types
  const event = eventData?.event;
  if (event === "payment_link.paid") {
    const paymentLinkId = eventData?.payload?.payment_link?.entity?.id;
    const share = await prisma.paymentShare.findFirst({
      where: { payLinkUrl: { contains: paymentLinkId } },
    });

    if (share) {
      await markSharePaid(share.id);
      logger.info({ shareId: share.id }, "[RazorpayWebhook] Payment link share marked PAID");
    }
  }

  return { status: "processed", event };
}
