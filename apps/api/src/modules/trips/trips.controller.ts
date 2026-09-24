import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate";
import { sendSuccess, sendCreated } from "../../lib/apiResponse";
import { CreateTripSchema, SelectPlanSchema, CustomizePlanSchema } from "./trips.schema";
import {
  createTrip,
  getPlansForTrip,
  generatePlansForTrip,
  selectPlan,
  getTripStatus,
  getTripConfirmation,
  getUserTrips,
} from "./trips.service";

export async function tripRoutes(app: FastifyInstance) {
  // All trip routes require auth
  app.addHook("preHandler", requireAuth());

  // GET /trips — list user's trips
  app.get("/", async (req, reply) => {
    const user = req.user as { sub: string };
    const trips = await getUserTrips(user.sub);
    return sendSuccess(reply, { trips });
  });

  // POST /trips — create a new trip
  app.post("/", { preHandler: validate(CreateTripSchema) }, async (req, reply) => {
    const user = req.user as { sub: string };
    const result = await createTrip(user.sub, (req as any).validated);
    return sendCreated(reply, result, "Trip created successfully.");
  });

  // GET /trips/:tripId/plans
  app.get("/:tripId/plans", async (req, reply) => {
    const user = req.user as { sub: string };
    const { tripId } = req.params as { tripId: string };
    const result = await getPlansForTrip(user.sub, tripId);
    return sendSuccess(reply, result);
  });

  // POST /trips/:tripId/generate-plans
  app.post("/:tripId/generate-plans", async (req, reply) => {
    const user = req.user as { sub: string };
    const { tripId } = req.params as { tripId: string };
    const result = await generatePlansForTrip(user.sub, tripId);
    return sendSuccess(reply, result);
  });

  // POST /trips/:tripId/select-plan
  app.post(
    "/:tripId/select-plan",
    { preHandler: validate(SelectPlanSchema) },
    async (req, reply) => {
      const user = req.user as { sub: string };
      const { tripId } = req.params as { tripId: string };
      const { planId } = (req as any).validated;
      const result = await selectPlan(user.sub, tripId, planId);
      return sendSuccess(reply, result, "Plan selected successfully.");
    }
  );

  // PATCH /trips/:tripId/customize
  app.patch(
    "/:tripId/customize",
    { preHandler: validate(CustomizePlanSchema) },
    async (req, reply) => {
      const { tripId } = req.params as { tripId: string };
      return sendSuccess(reply, {
        tripId,
        updated: (req as any).validated,
      }, "Plan customized successfully.");
    }
  );

  // GET /trips/:tripId/status
  app.get("/:tripId/status", async (req, reply) => {
    const user = req.user as { sub: string };
    const { tripId } = req.params as { tripId: string };
    const result = await getTripStatus(user.sub, tripId);
    return sendSuccess(reply, result);
  });

  // GET /trips/:tripId/confirmation
  app.get("/:tripId/confirmation", async (req, reply) => {
    const user = req.user as { sub: string };
    const { tripId } = req.params as { tripId: string };
    const result = await getTripConfirmation(user.sub, tripId);
    return sendSuccess(reply, result);
  });

  // POST /trips/:tripId/consent — returns itemized price + consent token
  app.post("/:tripId/consent", async (req, reply) => {
    const { tripId } = req.params as { tripId: string };
    const { consentService } = await import("../bookings/bookings.service");
    const user = req.user as { sub: string };
    const result = await consentService(user.sub, tripId);
    return sendSuccess(reply, result);
  });
}
