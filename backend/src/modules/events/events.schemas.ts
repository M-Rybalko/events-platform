import { z } from 'zod';

export const eventCategoryValues = [
  'concert',
  'volunteering',
  'rally',
  'festival',
  'workshop',
] as const;

export const eventStatusValues = ['draft', 'published', 'cancelled', 'completed'] as const;

const latitudeSchema = z.coerce.number().gte(-90).lte(90);
const longitudeSchema = z.coerce.number().gte(-180).lte(180);

const eventFields = z.object({
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().max(10_000).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  locationName: z.string().trim().max(500).optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  category: z.enum(eventCategoryValues),
  capacity: z.coerce.number().int().positive().optional(),
  coverImageUrl: z.string().url().optional(),
});

export const createEventSchema = eventFields
  .refine((data) => !data.endsAt || data.endsAt > data.startsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  })
  .refine(
    (data) => (data.latitude === undefined) === (data.longitude === undefined),
    {
      message: 'latitude and longitude must be provided together',
      path: ['latitude'],
    },
  );

export const updateEventSchema = eventFields
  .partial()
  .refine(
    (data) =>
      data.startsAt === undefined ||
      data.endsAt === undefined ||
      data.endsAt > data.startsAt,
    {
      message: 'endsAt must be after startsAt',
      path: ['endsAt'],
    },
  )
  .refine(
    (data) => (data.latitude === undefined) === (data.longitude === undefined),
    {
      message: 'latitude and longitude must be provided together',
      path: ['latitude'],
    },
  );

export const listEventsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: z.enum(eventCategoryValues).optional(),
  status: z.enum(eventStatusValues).optional(),
  organizerId: z.string().uuid().optional(),
  startsAfter: z.coerce.date().optional(),
  startsBefore: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  orderBy: z.enum(['startsAt', 'createdAt']).default('startsAt'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
});

export const mapEventsQuerySchema = z.object({
  category: z.enum(eventCategoryValues).optional(),
  startsAfter: z.coerce.date().optional(),
  startsBefore: z.coerce.date().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type MapEventsQuery = z.infer<typeof mapEventsQuerySchema>;
