import { z } from 'zod';

const tagNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[\p{L}\p{N}\s\-_]+$/u, 'Tag may contain letters, digits, spaces, dashes and underscores');

export const listTagsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

export const setEventTagsSchema = z.object({
  tags: z.array(tagNameSchema).max(20),
});

export type ListTagsQuery = z.infer<typeof listTagsQuerySchema>;
export type SetEventTagsInput = z.infer<typeof setEventTagsSchema>;
