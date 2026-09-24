import { z } from "zod";

export const CreateTripSchema = z.object({
  destination: z.string().min(2).max(200),
  originCity: z.string().min(2).max(100).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  travelers: z.number().int().min(1).max(20).default(1),
  budgetTier: z.enum(["LOW", "MEDIUM", "HIGH", "CUSTOM"]),
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(0).optional(),
});

export const SelectPlanSchema = z.object({
  planId: z.string().uuid(),
});

export const CustomizePlanSchema = z.object({
  component: z.enum(["TRAIN", "HOTEL", "CAB"]),
  optionId: z.string(),
});

export type CreateTripInput = z.infer<typeof CreateTripSchema>;
export type SelectPlanInput = z.infer<typeof SelectPlanSchema>;
export type CustomizePlanInput = z.infer<typeof CustomizePlanSchema>;
