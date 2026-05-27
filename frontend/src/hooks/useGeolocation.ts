import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'zbir:geolocation';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 хв — потім перепитуємо

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable' | 'error';

export interface GeoCoords {
  latitude: number;
  longitude: number;
}

interface CachedGeo {
  coords: GeoCoords;
  timestamp: number;
}

function loadCache(): GeoCoords | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedGeo;
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) return null;
    return parsed.coords;
  } catch {
    return null;
  }
}

function saveCache(coords: GeoCoords): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ coords, timestamp: Date.now() } satisfies CachedGeo),
    );
  } catch {
    // ignore
  }
}

export function useGeolocation() {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');

  // На старті — спробуємо взяти з кешу
  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      setCoords(cached);
      setStatus('granted');
    }
  }, []);

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const c: GeoCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoords(c);
        setStatus('granted');
        saveCache(c);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus('denied');
        else setStatus('error');
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: MAX_AGE_MS,
      },
    );
  }, []);

  const clear = useCallback(() => {
    setCoords(null);
    setStatus('idle');
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { coords, status, request, clear };
}
