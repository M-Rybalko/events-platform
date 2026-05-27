import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useMapEvents } from '@/features/events/useMapEvents';
import { CategoryBadge } from '@/features/events/CategoryBadge';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/constants';
import { formatEventDateShort } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useGeolocation, type GeoCoords } from '@/hooks/useGeolocation';
import type { EventCategory } from '@/lib/types';

const DEFAULT_CENTER: [number, number] = [48.8, 31.5];
const DEFAULT_ZOOM = 6;
const USER_ZOOM = 11;

const CATEGORY_ICON_COLORS: Record<EventCategory, string> = {
  concert:      '#ec4899',
  volunteering: '#10b981',
  rally:        '#f59e0b',
  festival:     '#8b5cf6',
  workshop:     '#0ea5e9',
};

const CATEGORY_EMOJI: Record<EventCategory, string> = {
  concert:      '♪',
  volunteering: '♥',
  rally:        '✺',
  festival:     '★',
  workshop:     '✎',
};

function createIcon(category: EventCategory) {
  const color = CATEGORY_ICON_COLORS[category];
  const symbol = CATEGORY_EMOJI[category];
  return L.divIcon({
    className: 'zbir-marker',
    html: `<div class="zbir-marker-inner" style="background:${color}"><span>${symbol}</span></div>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -38],
  });
}

// Пульсуючий маркер для позиції користувача
const userIcon = L.divIcon({
  className: 'zbir-user-marker',
  html:
    '<span class="zbir-user-pulse"></span>' +
    '<span class="zbir-user-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const tick = () => map.invalidateSize();
    const raf = requestAnimationFrame(tick);
    const t1 = setTimeout(tick, 100);
    const t2 = setTimeout(tick, 400);

    const container = map.getContainer();
    const observer = new ResizeObserver(tick);
    observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

/**
 * Плавно центрує карту на геолокацію користувача,
 * коли координати з'являються вперше.
 */
function FlyToUser({ coords, flown, onFlown }: {
  coords: GeoCoords | null;
  flown: boolean;
  onFlown: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!coords || flown) return;
    map.flyTo([coords.latitude, coords.longitude], USER_ZOOM, { duration: 1.4 });
    onFlown();
  }, [coords, flown, map, onFlown]);
  return null;
}

export function MapPage() {
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null);
  const [hasFlown, setHasFlown] = useState(false);
  const { coords, status, request } = useGeolocation();

  const { data, isLoading } = useMapEvents({
    category: activeCategory ?? undefined,
    startsAfter: useMemo(() => new Date().toISOString(), []),
  });

  const items = data?.items ?? [];

  return (
    <div className="fixed left-0 right-0 top-14 bottom-0 overflow-hidden">
      {/* Контрол-панель */}
      <div className="absolute top-4 left-4 z-[1100] max-w-sm pointer-events-auto">
        <div className="rounded-2xl bg-white/95 backdrop-blur shadow-lg shadow-slate-900/10 border border-slate-200/70 p-4 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">
              Карта заходів
            </p>
            <p className="text-sm text-slate-700">
              {isLoading
                ? 'Завантаження…'
                : `Знайдено ${items.length} ${
                    items.length === 1 ? 'захід' : 'заходів'
                  }`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all',
                !activeCategory
                  ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/30'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300',
              )}
            >
              Усі
            </button>
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-all',
                  activeCategory === cat
                    ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/30'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300',
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Геолокація */}
          <div className="pt-3 border-t border-slate-100">
            {status === 'granted' && coords && (
              <button
                type="button"
                onClick={() => setHasFlown(false)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-50 text-brand-700 px-3 py-2 text-xs font-medium hover:bg-brand-100 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Центрувати на мені
              </button>
            )}
            {(status === 'idle' || status === 'loading') && (
              <button
                type="button"
                onClick={request}
                disabled={status === 'loading'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white px-3 py-2 text-xs font-medium hover:shadow-md hover:shadow-brand-600/30 disabled:opacity-50 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                </svg>
                {status === 'loading' ? 'Визначаємо…' : 'Знайти мене'}
              </button>
            )}
            {(status === 'denied' || status === 'unavailable' || status === 'error') && (
              <p className="text-xs text-slate-400 text-center">
                Геолокація недоступна
              </p>
            )}
          </div>
        </div>
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomSnap={0.5}
        minZoom={5}
        maxZoom={18}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <ZoomControl position="bottomright" />
        <MapResizeFix />
        <FlyToUser coords={coords} flown={hasFlown} onFlown={() => setHasFlown(true)} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, тайли від <a href="https://www.openstreetmap.org.ua/">OSM Ukraine</a>'
          url="https://tile.openstreetmap.org.ua/styles/osm-bright/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Маркер користувача */}
        {coords && (
          <>
            <Marker
              position={[coords.latitude, coords.longitude]}
              icon={userIcon}
              interactive={false}
            />
            <Circle
              center={[coords.latitude, coords.longitude]}
              radius={500}
              pathOptions={{
                color: '#8b5cf6',
                fillColor: '#8b5cf6',
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
          </>
        )}

        <MarkerClusterGroup chunkedLoading>
          {items.map((event) => {
            const lat = parseFloat(event.latitude);
            const lng = parseFloat(event.longitude);
            if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

            return (
              <Marker
                key={event.id}
                position={[lat, lng]}
                icon={createIcon(event.category)}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <CategoryBadge category={event.category} className="mb-1.5" />
                    <Link
                      to={`/events/${event.id}`}
                      className="block text-sm font-semibold text-slate-900 hover:text-brand-600"
                    >
                      {event.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatEventDateShort(event.startsAt)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
