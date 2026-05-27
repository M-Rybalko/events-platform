import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Comment {
  id: string;
  text: string;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface RatingSummary {
  average: number | null;
  count: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export function useEventComments(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', 'comments', eventId],
    queryFn: () =>
      api.get<{
        items: Comment[];
        pagination: { total: number; limit: number; offset: number };
      }>(`/api/events/${eventId}/comments`, { query: { limit: 50 } }),
    enabled: Boolean(eventId),
  });
}

export function useEventRating(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', 'rating', eventId],
    queryFn: () => api.get<RatingSummary>(`/api/events/${eventId}/rating`),
    enabled: Boolean(eventId),
  });
}

export function useCreateComment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { text: string; rating?: number }) =>
      api.post<{ comment: Comment }>(`/api/events/${eventId}/comments`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events', 'comments', eventId] });
      void qc.invalidateQueries({ queryKey: ['events', 'rating', eventId] });
    },
  });
}

export function useDeleteComment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => api.delete<void>(`/api/comments/${commentId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events', 'comments', eventId] });
      void qc.invalidateQueries({ queryKey: ['events', 'rating', eventId] });
    },
  });
}
