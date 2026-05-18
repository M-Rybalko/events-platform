import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { mediaTypeEnum } from './enums';
import { events } from './events';

export const media = pgTable(
  'media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    type: mediaTypeEnum('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    eventIdx: index('media_event_idx').on(table.eventId),
  }),
);

export const mediaRelations = relations(media, ({ one }) => ({
  event: one(events, {
    fields: [media.eventId],
    references: [events.id],
  }),
}));

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
