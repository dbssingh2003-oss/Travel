import { z } from "zod";

export const createSplitPaymentSchema = z.object({
  tripId: z.string().uuid(),
  totalAmount: z.number().int().positive(),
  splits: z.array(
    z.object({
      travelerId: z.string(),
      name: z.string().optional(),
      amount: z.number().int().positive(),
    })
  ).min(2, "Split payment requires at least 2 travelers"),
});

export const updateSplitStatusSchema = z.object({
  shareId: z.string(),
  status: z.enum(["PENDING", "PAID", "FAILED"]),
});

export type CreateSplitPaymentInput = z.infer<typeof createSplitPaymentSchema>;
export type UpdateSplitStatusInput = z.infer<typeof updateSplitStatusSchema>;
