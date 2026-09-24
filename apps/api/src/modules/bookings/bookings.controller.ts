import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate";
import { sendSuccess } from "../../lib/apiResponse";
import { InitiateBookingSchema, CancelBookingSchema } from "./bookings.schema";
import { initiateBooking, cancelBooking } from "./bookings.service";

export async function bookingRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth());

  // POST /bookings/initiate
  app.post(
    "/initiate",
    { preHandler: validate(InitiateBookingSchema) },
    async (req, reply) => {
      const user = req.user as { sub: string };
      const result = await initiateBooking(user.sub, (req as any).validated);
      return sendSuccess(reply, result, "Booking saga initiated.", 202);
    }
  );

  // POST /bookings/:bookingId/cancel
  app.post(
    "/:bookingId/cancel",
    { preHandler: validate(CancelBookingSchema) },
    async (req, reply) => {
      const user = req.user as { sub: string };
      const { bookingId } = req.params as { bookingId: string };
      const { reason } = (req as any).validated ?? {};
      const result = await cancelBooking(user.sub, bookingId, reason);
      return sendSuccess(reply, result, "Booking cancellation initiated.");
    }
  );
}
