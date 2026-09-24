import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.middleware";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { createVendor, approveKyc, listVendors, rateVendor } from "./vendors.service";

const CreateVendorSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["TRAIN", "HOTEL", "CAB"]),
  contactPhone: z.string(),
  contactEmail: z.string().email(),
  city: z.string().optional(),
});

const RateVendorSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function vendorRoutes(app: FastifyInstance) {
  // POST /vendors — admin only
  app.post(
    "/",
    { preHandler: [requireAuth(["ADMIN"]), validate(CreateVendorSchema)] },
    async (req, reply) => {
      const vendor = await createVendor((req as any).validated);
      return reply.status(201).send(vendor);
    }
  );

  // PATCH /vendors/:id/kyc-approve — admin only
  app.patch(
    "/:id/kyc-approve",
    { preHandler: requireAuth(["ADMIN"]) },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const vendor = await approveKyc(id);
      return reply.send(vendor);
    }
  );

  // GET /vendors — public/internal search
  app.get("/", async (req, reply) => {
    const { type, city } = req.query as { type?: string; city?: string };
    const vendors = await listVendors(type as any, city);
    return reply.send({ vendors });
  });

  // POST /vendors/:id/ratings — authenticated users
  app.post(
    "/:id/ratings",
    { preHandler: [requireAuth(), validate(RateVendorSchema)] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { bookingId, rating, comment } = (req as any).validated;
      const result = await rateVendor(id, bookingId, rating, comment);
      return reply.status(201).send(result);
    }
  );
}
