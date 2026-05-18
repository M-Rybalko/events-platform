import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['participant', 'organizer', 'admin']);

export const eventCategoryEnum = pgEnum('event_category', [
  'concert',
  'volunteering',
  'rally',
  'festival',
  'workshop',
]);

export const eventStatusEnum = pgEnum('event_status', [
  'draft',
  'published',
  'cancelled',
  'completed',
]);

export const registrationStatusEnum = pgEnum('registration_status', [
  'registered',
  'cancelled',
  'attended',
]);

export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

export const notificationTypeEnum = pgEnum('notification_type', [
  'event_reminder',
  'event_cancelled',
  'event_updated',
  'new_comment',
  'registration_confirmed',
]);
