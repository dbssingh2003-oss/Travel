import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.middleware";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { getPendingBookings, claimBooking, confirmBooking, failBooking } from "./ops.service";

const ConfirmBookingSchema = z.object({ referenceCode: z.string().min(1) });
const FailBookingSchema = z.object({ reason: z.string().min(2) });

export async function opsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth(["SUPPORT", "ADMIN"]));

  // GET /ops/bookings/pending
  app.get("/bookings/pending", async (req, reply) => {
    const { type, city } = req.query as { type?: string; city?: string };
    const bookings = await getPendingBookings(type, city);
    return reply.send({ bookings });
  });

  // PATCH /ops/bookings/:id/claim
  app.patch("/:id/claim", async (req, reply) => {
    const user = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const result = await claimBooking(id, user.sub);
    return reply.send(result);
  });

  // PATCH /ops/bookings/:id/confirm
  app.patch(
    "/:id/confirm",
    { preHandler: validate(ConfirmBookingSchema) },
    async (req, reply) => {
      const user = req.user as { sub: string };
      const { id } = req.params as { id: string };
      const { referenceCode } = (req as any).validated;
      const result = await confirmBooking(id, referenceCode, user.sub);
      return reply.send(result);
    }
  );

  // PATCH /ops/bookings/:id/fail
  app.patch(
    "/:id/fail",
    { preHandler: validate(FailBookingSchema) },
    async (req, reply) => {
      const user = req.user as { sub: string };
      const { id } = req.params as { id: string };
      const { reason } = (req as any).validated;
      const result = await failBooking(id, reason, user.sub);
      return reply.send(result);
    }
  );
}
