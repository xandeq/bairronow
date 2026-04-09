import { z } from "zod";

// Phase 4 Plan 02 Task 0 — buyer rates seller (D-22).
export const ratingSchema = z.object({
  stars: z
    .number()
    .int()
    .min(1, "Mínimo 1 estrela")
    .max(5, "Máximo 5 estrelas"),
  comment: z.string().max(500, "Máximo 500 caracteres").optional(),
  listingId: z.number().int().positive(),
});

export type RatingFormValues = z.infer<typeof ratingSchema>;
