import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/auth.middleware";
import { sendSuccess } from "../../../lib/apiResponse";
import { createTripLegSchema, updateTripLegSchema } from "./legs.schema";
import * as legsService from "./legs.service";

export async function legRoutes(app: FastifyInstance) {
  // GET /api/v1/trips/:tripId/legs
  app.get<{ Params: { tripId: string } }>(
    "/:tripId/legs",
    { preHandler: [requireAuth()] },
    async (request, reply) => {
      const { tripId } = request.params;
      const legs = await legsService.getTripLegs(tripId);
      return sendSuccess(reply, legs);
    }
  );

  // POST /api/v1/trips/:tripId/legs
  app.post<{ Params: { tripId: string }; Body: any }>(
    "/:tripId/legs",
    { preHandler: [requireAuth()] },
    async (request, reply) => {
      const { tripId } = request.params;
      const body = typeof request.body === "object" && request.body !== null ? request.body : {};
      const parsed = createTripLegSchema.parse({ ...body, tripId });
      const leg = await legsService.createTripLeg(parsed);
      return sendSuccess(reply, leg, 201);
    }
  );

  // PATCH /api/v1/trips/legs/:id
  app.patch<{ Params: { id: string }; Body: any }>(
    "/legs/:id",
    { preHandler: [requireAuth()] },
    async (request, reply) => {
      const { id } = request.params;
      const parsed = updateTripLegSchema.parse(request.body);
      const leg = await legsService.updateTripLeg(id, parsed);
      return sendSuccess(reply, leg);
    }
  );

  // DELETE /api/v1/trips/legs/:id
  app.delete<{ Params: { id: string } }>(
    "/legs/:id",
    { preHandler: [requireAuth()] },
    async (request, reply) => {
      const { id } = request.params;
      await legsService.deleteTripLeg(id);
      return sendSuccess(reply, { deleted: true });
    }
  );
}
