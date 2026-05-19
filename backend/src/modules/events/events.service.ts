import { and, asc, desc, eq, gte, ilike, lte, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { events, type Event, type NewEvent } from '@/db/schema';
import type {
  CreateEventInput,
  ListEventsQuery,
  MapEventsQuery,
  UpdateEventInput,
} from './events.schemas';

export class EventError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'FORBIDDEN' | 'INVALID_STATE',
    message: string,
  ) {
    super(message);
  }
}

function toNumericString(value: number | undefined): string | undefined {
  return value === undefined ? undefined : value.toString();
}

function buildListFilters(query: ListEventsQuery): SQL[] {
  const filters: SQL[] = [];

  if (query.search) {
    filters.push(ilike(events.title, `%${query.search}%`));
  }
  if (query.category) filters.push(eq(events.category, query.category));
  if (query.status) filters.push(eq(events.status, query.status));
  if (query.organizerId) filters.push(eq(events.organizerId, query.organizerId));
  if (query.startsAfter) filters.push(gte(events.startsAt, query.startsAfter));
  if (query.startsBefore) filters.push(lte(events.startsAt, query.startsBefore));

  return filters;
}

export async function listEvents(query: ListEventsQuery): Promise<{
  items: Array<Event & { organizer: { id: string; name: string; avatarUrl: string | null } }>;
  total: number;
}> {
  const filters = buildListFilters(query);
  const where = filters.length > 0 ? and(...filters) : undefined;

  const orderColumn = query.orderBy === 'createdAt' ? events.createdAt : events.startsAt;
  const orderFn = query.orderDir === 'desc' ? desc : asc;

  const items = await db.query.events.findMany({
    where,
    orderBy: orderFn(orderColumn),
    limit: query.limit,
    offset: query.offset,
    with: {
      organizer: {
        columns: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(events)
    .where(where ?? sql`true`);

  return { items, total: count ?? 0 };
}

export async function getEventById(id: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      organizer: {
        columns: { id: true, name: true, avatarUrl: true, email: true },
      },
    },
  });

  return event ?? null;
}

export async function getMapEvents(query: MapEventsQuery) {
  const filters: SQL[] = [
    eq(events.status, 'published'),
    sql`${events.latitude} IS NOT NULL`,
    sql`${events.longitude} IS NOT NULL`,
  ];

  if (query.category) filters.push(eq(events.category, query.category));
  if (query.startsAfter) filters.push(gte(events.startsAt, query.startsAfter));
  if (query.startsBefore) filters.push(lte(events.startsAt, query.startsBefore));

  return db
    .select({
      id: events.id,
      title: events.title,
      latitude: events.latitude,
      longitude: events.longitude,
      category: events.category,
      startsAt: events.startsAt,
    })
    .from(events)
    .where(and(...filters))
    .limit(500);
}

export async function createEvent(
  organizerId: string,
  input: CreateEventInput,
): Promise<Event> {
  const newEvent: NewEvent = {
    title: input.title,
    description: input.description ?? null,
    startsAt: input.startsAt,
    endsAt: input.endsAt ?? null,
    locationName: input.locationName ?? null,
    latitude: toNumericString(input.latitude) ?? null,
    longitude: toNumericString(input.longitude) ?? null,
    category: input.category,
    capacity: input.capacity ?? null,
    coverImageUrl: input.coverImageUrl ?? null,
    organizerId,
    status: 'draft',
  };

  const [created] = await db.insert(events).values(newEvent).returning();
  if (!created) throw new Error('Failed to create event');
  return created;
}

async function loadOwnedEvent(eventId: string, userId: string, role: string): Promise<Event> {
  const existing = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!existing) {
    throw new EventError('NOT_FOUND', 'Event not found');
  }
  if (role !== 'admin' && existing.organizerId !== userId) {
    throw new EventError('FORBIDDEN', 'You can only modify your own events');
  }
  return existing;
}

export async function updateEvent(
  eventId: string,
  userId: string,
  role: string,
  input: UpdateEventInput,
): Promise<Event> {
  await loadOwnedEvent(eventId, userId, role);

  const patch: Partial<NewEvent> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.startsAt !== undefined) patch.startsAt = input.startsAt;
  if (input.endsAt !== undefined) patch.endsAt = input.endsAt ?? null;
  if (input.locationName !== undefined) patch.locationName = input.locationName ?? null;
  if (input.latitude !== undefined) patch.latitude = toNumericString(input.latitude) ?? null;
  if (input.longitude !== undefined) patch.longitude = toNumericString(input.longitude) ?? null;
  if (input.category !== undefined) patch.category = input.category;
  if (input.capacity !== undefined) patch.capacity = input.capacity ?? null;
  if (input.coverImageUrl !== undefined) patch.coverImageUrl = input.coverImageUrl ?? null;

  const [updated] = await db
    .update(events)
    .set(patch)
    .where(eq(events.id, eventId))
    .returning();

  if (!updated) throw new Error('Failed to update event');
  return updated;
}

export async function deleteEvent(eventId: string, userId: string, role: string): Promise<void> {
  await loadOwnedEvent(eventId, userId, role);
  await db.delete(events).where(eq(events.id, eventId));
}

export async function publishEvent(
  eventId: string,
  userId: string,
  role: string,
): Promise<Event> {
  const existing = await loadOwnedEvent(eventId, userId, role);

  if (existing.status !== 'draft') {
    throw new EventError('INVALID_STATE', `Cannot publish event with status "${existing.status}"`);
  }

  const [updated] = await db
    .update(events)
    .set({ status: 'published', updatedAt: new Date() })
    .where(eq(events.id, eventId))
    .returning();

  if (!updated) throw new Error('Failed to publish event');
  return updated;
}

export async function cancelEvent(
  eventId: string,
  userId: string,
  role: string,
): Promise<Event> {
  const existing = await loadOwnedEvent(eventId, userId, role);

  if (existing.status === 'cancelled' || existing.status === 'completed') {
    throw new EventError(
      'INVALID_STATE',
      `Cannot cancel event with status "${existing.status}"`,
    );
  }

  const [updated] = await db
    .update(events)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(events.id, eventId))
    .returning();

  if (!updated) throw new Error('Failed to cancel event');
  return updated;
}
