import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  EventCategory,
  EventStatus,
  EventSummary,
  EventWithOrganizer,
  Paginated,
} from '@/lib/types';

// ───── Types ─────

export interface ListEventsParams {
  search?: string;
  category?: EventCategory;
  status?: EventStatus;
  organizerId?: string;
  startsAfter?: string;
  startsBefore?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'startsAt' | 'createdAt';
  orderDir?: 'asc' | 'desc';
}

export interface EventRegistration {
  id: string;
  status: 'registered' | 'cancelled' | 'attended';
  registeredAt?: string;
  createdAt?: string;
  event?: EventSummary;
}

// ───── Queries ─────

export function useEvents(params: ListEventsParams = {}) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () =>
      api.get<Paginated<EventWithOrganizer>>('/api/events', { query: params }),
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['events', 'detail', id],
    queryFn: () => api.get<{ event: EventWithOrganizer }>(`/api/events/${id}`),
    enabled: Boolean(id),
  });
}

export function useEventTags(id: string | undefined) {
  return useQuery({
    queryKey: ['events', 'tags', id],
    queryFn: () => api.get<{ items: Array<{ id: string; name: string }> }>(`/api/events/${id}/tags`),
    enabled: Boolean(id),
  });
}

export function useMyRegistrations(enabled = true) {
  return useQuery({
    queryKey: ['me', 'registrations'],
    queryFn: () =>
      api.get<{
        items: Array<EventRegistration & { event: EventSummary }>;
        pagination: { total: number; limit: number; offset: number };
      }>('/api/me/registrations', { query: { limit: 100 } }),
    enabled,
  });
}

// ───── Mutations ─────

export interface CreateEventInput {
  title: string;
  description?: string;
  startsAt: string; // ISO
  endsAt?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  category: EventCategory;
  capacity?: number;
  coverImageUrl?: string;
}

export type UpdateEventInput = Partial<CreateEventInput>;

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      api.post<{ event: EventWithOrganizer }>('/api/events', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEventInput) =>
      api.patch<{ event: EventWithOrganizer }>(`/api/events/${eventId}`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function usePublishEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ event: EventWithOrganizer }>(`/api/events/${eventId}/publish`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useCancelEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ event: EventWithOrganizer }>(`/api/events/${eventId}/cancel`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useDeleteEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>(`/api/events/${eventId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useSetEventTags(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tags: string[]) =>
      api.put<{ items: Array<{ id: string; name: string }> }>(
        `/api/events/${eventId}/tags`,
        { tags },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events', 'tags', eventId] });
      void qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export interface EventParticipant {
  registrationId: string;
  status: 'registered' | 'cancelled' | 'attended';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export function useEventParticipants(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', 'participants', eventId],
    queryFn: () =>
      api.get<{
        items: EventParticipant[];
        counts: { registered: number; cancelled: number; attended: number };
        capacity: number | null;
      }>(`/api/events/${eventId}/registrations`),
    enabled: Boolean(eventId),
  });
}

export function useTags(search?: string) {
  return useQuery({
    queryKey: ['tags', search],
    queryFn: () =>
      api.get<{ items: Array<{ id: string; name: string; eventCount: number }> }>(
        '/api/tags',
        { query: { search, limit: 30 } },
      ),
  });
}

export function useRegisterForEvent(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ registration: EventRegistration }>(`/api/events/${eventId}/register`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me', 'registrations'] });
      void qc.invalidateQueries({ queryKey: ['events', 'detail', eventId] });
    },
  });
}

export function useCancelRegistration(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<{ registration: EventRegistration }>(`/api/events/${eventId}/register`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me', 'registrations'] });
      void qc.invalidateQueries({ queryKey: ['events', 'detail', eventId] });
    },
  });
}
