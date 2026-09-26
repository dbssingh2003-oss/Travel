import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.middleware";
import { sendSuccess } from "../../lib/apiResponse";
import { createSplitPaymentSchema, updateSplitStatusSchema } from "./payments.schema";
import * as splitService from "./split/splitPayment.service";
import { handleRazorpayWebhook } from "./webhooks/razorpay.webhook";

export async function paymentRoutes(app: FastifyInstance) {
  // POST /api/v1/payments/split/create
  app.post(
    "/split/create",
    { preHandler: [requireAuth()] },
    async (request, reply) => {
      const parsed = createSplitPaymentSchema.parse(request.body);
      const result = await splitService.createSplitPaymentGroup(parsed);
      return sendSuccess(reply, result, 201);
    }
  );

  // GET /api/v1/payments/split/:tripId
  app.get<{ Params: { tripId: string } }>(
    "/split/:tripId",
    { preHandler: [requireAuth()] },
    async (request, reply) => {
      const { tripId } = request.params;
      const shares = await splitService.getTripPaymentShares(tripId);
      return sendSuccess(reply, shares);
    }
  );

  // PATCH /api/v1/payments/split/status
  app.patch(
    "/split/status",
    { preHandler: [requireAuth()] },
    async (request, reply) => {
      const parsed = updateSplitStatusSchema.parse(request.body);
      if (parsed.status === "PAID") {
        const result = await splitService.markSharePaid(parsed.shareId);
        return sendSuccess(reply, result);
      }
      return sendSuccess(reply, { updated: true });
    }
  );

  // POST /api/v1/payments/webhook/razorpay
  app.post(
    "/webhook/razorpay",
    async (request, reply) => {
      const signature = (request.headers["x-razorpay-signature"] as string) || "";
      const rawBody = JSON.stringify(request.body);
      const result = await handleRazorpayWebhook(signature, rawBody, request.body);
      return sendSuccess(reply, result);
    }
  );
}
