import { z } from "zod";

export const createTripLegSchema = z.object({
  tripId: z.string().uuid(),
  sequence: z.number().int().min(1),
  originCity: z.string().min(2, "Origin city is required"),
  destination: z.string().min(2, "Destination is required"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateTripLegSchema = createTripLegSchema.partial().omit({ tripId: true });

export type CreateTripLegInput = z.infer<typeof createTripLegSchema>;
export type UpdateTripLegInput = z.infer<typeof updateTripLegSchema>;
