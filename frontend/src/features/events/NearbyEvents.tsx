import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EventCard } from './EventCard';
import { useEvents } from './hooks';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatDistance, haversineKm } from '@/lib/distance';

interface Props {
  nowIso: string;
}

const MAX_KM = 100; // показуємо тільки в радіусі 100 км
const SHOW_COUNT = 6;

export function NearbyEvents({ nowIso }: Props) {
  const { coords, status, request } = useGeolocation();

  const allEvents = useEvents({
    status: 'published',
    startsAfter: nowIso,
    limit: 100,
    orderBy: 'startsAt',
    orderDir: 'asc',
  });

  const sorted = useMemo(() => {
    if (!coords || !allEvents.data) return [];

    return allEvents.data.items
      .filter((e) => e.latitude !== null && e.longitude !== null)
      .map((e) => ({
        event: e,
        distance: haversineKm(
          { lat: coords.latitude, lng: coords.longitude },
          { lat: Number(e.latitude), lng: Number(e.longitude) },
        ),
      }))
      .filter((x) => x.distance <= MAX_KM)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, SHOW_COUNT);
  }, [coords, allEvents.data]);

  // Запитуємо дозвіл
  if (status === 'idle') {
    return (
      <Card className="bg-gradient-to-br from-brand-50 to-fuchsia-50 border-brand-100">
        <CardBody className="md:flex md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Знайти заходи поруч</h3>
              <p className="text-sm text-slate-600 mt-1">
                Дозвольте геолокацію — покажемо заходи у радіусі 100 км від вас.
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex-shrink-0">
            <Button onClick={request}>Показати поруч</Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (status === 'denied' || status === 'unavailable' || status === 'error') {
    return null; // тихо ховаємось, не дратуємо
  }

  if (status === 'loading' || allEvents.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-sm text-slate-500">
          У радіусі 100 км від вас поки немає опублікованих заходів.{' '}
          <Link to="/events" className="text-brand-600 hover:underline">
            Подивитись усі →
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map(({ event, distance }) => (
        <div key={event.id} className="relative">
          <EventCard event={event} />
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200/60 shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z" stroke="currentColor" strokeWidth="2" />
            </svg>
            {formatDistance(distance)}
          </span>
        </div>
      ))}
    </div>
  );
}

