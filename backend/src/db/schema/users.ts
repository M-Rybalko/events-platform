import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';
import { events } from './events';
import { registrations } from './registrations';
import { comments } from './comments';
import { notifications } from './notifications';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }),
    name: varchar('name', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    role: userRoleEnum('role').notNull().default('participant'),
    googleId: varchar('google_id', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    googleIdIdx: uniqueIndex('users_google_id_idx').on(table.googleId),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  organizedEvents: many(events),
  registrations: many(registrations),
  comments: many(comments),
  notifications: many(notifications),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
