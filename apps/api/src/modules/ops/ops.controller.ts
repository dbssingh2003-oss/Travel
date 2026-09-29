import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.middleware";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { sendSuccess } from "../../lib/apiResponse";
import { getPendingBookings, claimBooking, confirmBooking, failBooking } from "./ops.service";

const ConfirmBookingSchema = z.object({ referenceCode: z.string().min(1) });
const FailBookingSchema = z.object({ reason: z.string().min(2) });

export async function opsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth(["SUPPORT", "ADMIN"]));

  // GET /ops/bookings/pending
  app.get("/bookings/pending", async (req, reply) => {
    const { type, city } = req.query as { type?: string; city?: string };
    const bookings = await getPendingBookings(type, city);
    return sendSuccess(reply, { bookings });
  });

  // PATCH /ops/bookings/:id/claim (supports both /ops/:id/claim and /ops/bookings/:id/claim)
  const handleClaim = async (req: any, reply: any) => {
    const user = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const result = await claimBooking(id, user.sub);
    return sendSuccess(reply, result, "Booking claimed by agent.");
  };
  app.patch("/:id/claim", handleClaim);
  app.patch("/bookings/:id/claim", handleClaim);

  // PATCH /ops/bookings/:id/confirm
  const handleConfirm = async (req: any, reply: any) => {
    const user = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const { referenceCode } = (req as any).validated;
    const result = await confirmBooking(id, referenceCode, user.sub);
    return sendSuccess(reply, result, "Booking confirmed.");
  };
  app.patch("/:id/confirm", { preHandler: validate(ConfirmBookingSchema) }, handleConfirm);
  app.patch("/bookings/:id/confirm", { preHandler: validate(ConfirmBookingSchema) }, handleConfirm);

  // PATCH /ops/bookings/:id/fail
  const handleFail = async (req: any, reply: any) => {
    const user = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const { reason } = (req as any).validated;
    const result = await failBooking(id, reason, user.sub);
    return sendSuccess(reply, result, "Booking marked as failed.");
  };
  app.patch("/:id/fail", { preHandler: validate(FailBookingSchema) }, handleFail);
  app.patch("/bookings/:id/fail", { preHandler: validate(FailBookingSchema) }, handleFail);
}
