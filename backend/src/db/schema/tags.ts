import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { events } from './events';

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex('tags_name_idx').on(table.name),
  }),
);

export const tagsRelations = relations(tags, ({ many }) => ({
  eventTags: many(eventTags),
}));

export const eventTags = pgTable(
  'event_tags',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.eventId, table.tagId] }),
  }),
);

export const eventTagsRelations = relations(eventTags, ({ one }) => ({
  event: one(events, {
    fields: [eventTags.eventId],
    references: [events.id],
  }),
  tag: one(tags, {
    fields: [eventTags.tagId],
    references: [tags.id],
  }),
}));

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
