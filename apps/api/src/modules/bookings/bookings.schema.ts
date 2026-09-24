import { z } from "zod";

export const InitiateBookingSchema = z.object({
  tripId: z.string().uuid(),
  consentToken: z.string(),
  paymentMethodToken: z.string(),
});

export const CancelBookingSchema = z.object({
  reason: z.string().min(2).max(500).optional(),
});

export type InitiateBookingInput = z.infer<typeof InitiateBookingSchema>;
