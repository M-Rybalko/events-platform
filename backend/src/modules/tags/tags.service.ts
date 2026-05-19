import { and, eq, ilike, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { tags, eventTags, events, type Tag } from '@/db/schema';
import type { ListTagsQuery, SetEventTagsInput } from './tags.schemas';

export class TagError extends Error {
  constructor(
    public readonly code: 'EVENT_NOT_FOUND' | 'FORBIDDEN',
    message: string,
  ) {
    super(message);
  }
}

function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

export async function listTags(query: ListTagsQuery) {
  const items = await db
    .select({
      id: tags.id,
      name: tags.name,
      eventCount: sql<number>`cast(count(${eventTags.eventId}) as int)`,
    })
    .from(tags)
    .leftJoin(eventTags, eq(eventTags.tagId, tags.id))
    .where(query.search ? ilike(tags.name, `%${query.search}%`) : undefined)
    .groupBy(tags.id, tags.name)
    .orderBy(sql`count(${eventTags.eventId}) DESC`)
    .limit(query.limit);

  return items;
}

export async function getEventTags(eventId: string) {
  return db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(eventTags)
    .innerJoin(tags, eq(eventTags.tagId, tags.id))
    .where(eq(eventTags.eventId, eventId));
}

async function findOrCreateTags(names: string[]): Promise<Tag[]> {
  if (names.length === 0) return [];

  const normalized = Array.from(new Set(names.map(normalizeTagName)));

  const existing = await db.select().from(tags).where(inArray(tags.name, normalized));
  const existingNames = new Set(existing.map((t) => t.name));

  const toInsert = normalized.filter((n) => !existingNames.has(n));

  let created: Tag[] = [];
  if (toInsert.length > 0) {
    created = await db
      .insert(tags)
      .values(toInsert.map((name) => ({ name })))
      .returning();
  }

  return [...existing, ...created];
}

export async function setEventTags(
  eventId: string,
  userId: string,
  role: string,
  input: SetEventTagsInput,
): Promise<Tag[]> {
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) {
    throw new TagError('EVENT_NOT_FOUND', 'Event not found');
  }
  if (role !== 'admin' && event.organizerId !== userId) {
    throw new TagError('FORBIDDEN', 'Only the organizer can manage tags for this event');
  }

  return db.transaction(async (tx) => {
    const resolved = await findOrCreateTags(input.tags);

    await tx.delete(eventTags).where(eq(eventTags.eventId, eventId));

    if (resolved.length > 0) {
      await tx
        .insert(eventTags)
        .values(resolved.map((tag) => ({ eventId, tagId: tag.id })));
    }

    return resolved;
  });
}

export async function removeEventTag(
  eventId: string,
  tagId: string,
  userId: string,
  role: string,
): Promise<void> {
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) {
    throw new TagError('EVENT_NOT_FOUND', 'Event not found');
  }
  if (role !== 'admin' && event.organizerId !== userId) {
    throw new TagError('FORBIDDEN', 'Only the organizer can manage tags for this event');
  }

  await db
    .delete(eventTags)
    .where(and(eq(eventTags.eventId, eventId), eq(eventTags.tagId, tagId)));
}
