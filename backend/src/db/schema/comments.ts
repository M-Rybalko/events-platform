import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { events } from './events';

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    rating: integer('rating'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    eventIdx: index('comments_event_idx').on(table.eventId),
    userIdx: index('comments_user_idx').on(table.userId),
  }),
);

export const commentsRelations = relations(comments, ({ one }) => ({
  event: one(events, {
    fields: [comments.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
