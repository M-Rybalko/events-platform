export type UserRole = 'participant' | 'organizer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  googleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EventCategory =
  | 'concert'
  | 'volunteering'
  | 'rally'
  | 'festival'
  | 'workshop';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface EventSummary {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  locationName: string | null;
  latitude: string | null;
  longitude: string | null;
  category: EventCategory;
  capacity: number | null;
  organizerId: string;
  coverImageUrl: string | null;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventWithOrganizer extends EventSummary {
  organizer: {
    id: string;
    name: string;
    avatarUrl: string | null;
    email?: string;
  };
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
