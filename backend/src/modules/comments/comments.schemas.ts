import { z } from 'zod';

export const createCommentSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export const listCommentsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  withRating: z.coerce.boolean().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
