import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  index,
} from 'drizzle-orm/pg-core';
import { eventCategoryEnum, eventStatusEnum } from './enums';
import { users } from './users';
import { registrations } from './registrations';
import { comments } from './comments';
import { eventTags } from './tags';
import { media } from './media';

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),

    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),

    locationName: varchar('location_name', { length: 500 }),
    latitude: decimal('latitude', { precision: 9, scale: 6 }),
    longitude: decimal('longitude', { precision: 9, scale: 6 }),

    category: eventCategoryEnum('category').notNull(),
    capacity: integer('capacity'),

    organizerId: uuid('organizer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    coverImageUrl: text('cover_image_url'),
    status: eventStatusEnum('status').notNull().default('draft'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    startsAtIdx: index('events_starts_at_idx').on(table.startsAt),
    categoryIdx: index('events_category_idx').on(table.category),
    statusIdx: index('events_status_idx').on(table.status),
    organizerIdx: index('events_organizer_idx').on(table.organizerId),
  }),
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  registrations: many(registrations),
  comments: many(comments),
  eventTags: many(eventTags),
  media: many(media),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
