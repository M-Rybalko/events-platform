import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventCategory } from '@/lib/types';

export interface MapEvent {
  id: string;
  title: string;
  latitude: string;
  longitude: string;
  category: EventCategory;
  startsAt: string;
}

export interface MapEventsParams {
  category?: EventCategory;
  startsAfter?: string;
  startsBefore?: string;
}

export function useMapEvents(params: MapEventsParams = {}) {
  return useQuery({
    queryKey: ['events', 'map', params],
    queryFn: () =>
      api.get<{ items: MapEvent[] }>('/api/events/map', { query: params }),
  });
}
