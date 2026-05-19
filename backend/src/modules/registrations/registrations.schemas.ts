import { z } from 'zod';
import { eventCategoryValues } from '@/modules/events/events.schemas';

export const myRegistrationsQuerySchema = z.object({
  status: z.enum(['registered', 'cancelled', 'attended']).optional(),
  category: z.enum(eventCategoryValues).optional(),
  upcoming: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type MyRegistrationsQuery = z.infer<typeof myRegistrationsQuerySchema>;
