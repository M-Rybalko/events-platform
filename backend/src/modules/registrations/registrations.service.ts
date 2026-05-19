import { and, asc, count, desc, eq, gte, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { events, registrations, users, type Registration } from '@/db/schema';
import type { MyRegistrationsQuery } from './registrations.schemas';

export class RegistrationError extends Error {
  constructor(
    public readonly code:
      | 'EVENT_NOT_FOUND'
      | 'EVENT_NOT_OPEN'
      | 'ALREADY_REGISTERED'
      | 'CAPACITY_REACHED'
      | 'NOT_REGISTERED'
      | 'FORBIDDEN',
    message: string,
  ) {
    super(message);
  }
}

export async function registerForEvent(
  eventId: string,
  userId: string,
): Promise<Registration> {
  return db.transaction(async (tx) => {
    const event = await tx.query.events.findFirst({ where: eq(events.id, eventId) });
    if (!event) {
      throw new RegistrationError('EVENT_NOT_FOUND', 'Event not found');
    }
    if (event.status !== 'published') {
      throw new RegistrationError(
        'EVENT_NOT_OPEN',
        `Cannot register: event status is "${event.status}"`,
      );
    }

    const existing = await tx.query.registrations.findFirst({
      where: and(eq(registrations.eventId, eventId), eq(registrations.userId, userId)),
    });

    if (existing && existing.status === 'registered') {
      throw new RegistrationError('ALREADY_REGISTERED', 'You are already registered');
    }

    if (event.capacity !== null) {
      const [{ value: activeCount }] = await tx
        .select({ value: count() })
        .from(registrations)
        .where(
          and(eq(registrations.eventId, eventId), eq(registrations.status, 'registered')),
        );

      if (activeCount >= event.capacity) {
        throw new RegistrationError('CAPACITY_REACHED', 'Event has reached its capacity');
      }
    }

    if (existing) {
      const [updated] = await tx
        .update(registrations)
        .set({ status: 'registered', updatedAt: new Date() })
        .where(eq(registrations.id, existing.id))
        .returning();

      if (!updated) throw new Error('Failed to re-register');
      return updated;
    }

    const [created] = await tx
      .insert(registrations)
      .values({ eventId, userId, status: 'registered' })
      .returning();

    if (!created) throw new Error('Failed to register');
    return created;
  });
}

export async function cancelRegistration(
  eventId: string,
  userId: string,
): Promise<Registration> {
  const existing = await db.query.registrations.findFirst({
    where: and(eq(registrations.eventId, eventId), eq(registrations.userId, userId)),
  });

  if (!existing || existing.status !== 'registered') {
    throw new RegistrationError(
      'NOT_REGISTERED',
      'You are not registered for this event',
    );
  }

  const [updated] = await db
    .update(registrations)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(registrations.id, existing.id))
    .returning();

  if (!updated) throw new Error('Failed to cancel registration');
  return updated;
}

export async function listEventRegistrations(
  eventId: string,
  requesterId: string,
  requesterRole: string,
) {
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) {
    throw new RegistrationError('EVENT_NOT_FOUND', 'Event not found');
  }
  if (requesterRole !== 'admin' && event.organizerId !== requesterId) {
    throw new RegistrationError(
      'FORBIDDEN',
      'Only the event organizer can view registrations',
    );
  }

  const items = await db
    .select({
      registrationId: registrations.id,
      status: registrations.status,
      createdAt: registrations.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(registrations)
    .innerJoin(users, eq(registrations.userId, users.id))
    .where(eq(registrations.eventId, eventId))
    .orderBy(desc(registrations.createdAt));

  const counts = {
    registered: 0,
    cancelled: 0,
    attended: 0,
  };
  for (const r of items) {
    counts[r.status] += 1;
  }

  return { items, counts, capacity: event.capacity };
}

export async function listMyRegistrations(userId: string, query: MyRegistrationsQuery) {
  const filters: SQL[] = [eq(registrations.userId, userId)];

  if (query.status) {
    filters.push(eq(registrations.status, query.status));
  }
  if (query.category) {
    filters.push(eq(events.category, query.category));
  }
  if (query.upcoming) {
    filters.push(gte(events.startsAt, new Date()));
  }

  const items = await db
    .select({
      registrationId: registrations.id,
      status: registrations.status,
      registeredAt: registrations.createdAt,
      event: events,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(and(...filters))
    .orderBy(query.upcoming ? asc(events.startsAt) : desc(events.startsAt))
    .limit(query.limit)
    .offset(query.offset);

  const [{ total }] = await db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(and(...filters));

  return {
    items,
    pagination: { total: total ?? 0, limit: query.limit, offset: query.offset },
  };
}
