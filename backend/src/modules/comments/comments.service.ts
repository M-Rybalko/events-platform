import { and, desc, eq, isNotNull, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { comments, events, users, type Comment } from '@/db/schema';
import type { CreateCommentInput, ListCommentsQuery } from './comments.schemas';

export class CommentError extends Error {
  constructor(
    public readonly code: 'EVENT_NOT_FOUND' | 'COMMENT_NOT_FOUND' | 'FORBIDDEN',
    message: string,
  ) {
    super(message);
  }
}

export async function listEventComments(eventId: string, query: ListCommentsQuery) {
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) {
    throw new CommentError('EVENT_NOT_FOUND', 'Event not found');
  }

  const filters: SQL[] = [eq(comments.eventId, eventId)];
  if (query.withRating) filters.push(isNotNull(comments.rating));

  const items = await db
    .select({
      id: comments.id,
      text: comments.text,
      rating: comments.rating,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(...filters))
    .orderBy(desc(comments.createdAt))
    .limit(query.limit)
    .offset(query.offset);

  const [{ total }] = await db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(comments)
    .where(and(...filters));

  return {
    items,
    pagination: { total: total ?? 0, limit: query.limit, offset: query.offset },
  };
}

export async function createComment(
  eventId: string,
  userId: string,
  input: CreateCommentInput,
): Promise<Comment> {
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) {
    throw new CommentError('EVENT_NOT_FOUND', 'Event not found');
  }

  const [created] = await db
    .insert(comments)
    .values({
      eventId,
      userId,
      text: input.text,
      rating: input.rating ?? null,
    })
    .returning();

  if (!created) throw new Error('Failed to create comment');
  return created;
}

export async function deleteComment(
  commentId: string,
  requesterId: string,
  requesterRole: string,
): Promise<void> {
  const existing = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
  });

  if (!existing) {
    throw new CommentError('COMMENT_NOT_FOUND', 'Comment not found');
  }

  if (requesterRole !== 'admin' && existing.userId !== requesterId) {
    throw new CommentError('FORBIDDEN', 'You can only delete your own comments');
  }

  await db.delete(comments).where(eq(comments.id, commentId));
}

export async function getEventRating(eventId: string) {
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) {
    throw new CommentError('EVENT_NOT_FOUND', 'Event not found');
  }

  const [stats] = await db
    .select({
      average: sql<number | null>`avg(${comments.rating})::float`,
      count: sql<number>`cast(count(${comments.rating}) as int)`,
    })
    .from(comments)
    .where(and(eq(comments.eventId, eventId), isNotNull(comments.rating)));

  const distributionRows = await db
    .select({
      rating: comments.rating,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(comments)
    .where(and(eq(comments.eventId, eventId), isNotNull(comments.rating)))
    .groupBy(comments.rating);

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distributionRows) {
    if (row.rating && row.rating >= 1 && row.rating <= 5) {
      distribution[row.rating as 1 | 2 | 3 | 4 | 5] = row.count;
    }
  }

  return {
    average: stats?.average ? Number(stats.average.toFixed(2)) : null,
    count: stats?.count ?? 0,
    distribution,
  };
}
