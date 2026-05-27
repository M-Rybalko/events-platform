/**
 * Геокодування через Nominatim (OpenStreetMap).
 * Безкоштовно, без API-ключа. Обмеження — 1 запит/сек.
 *
 * https://nominatim.org/release-docs/develop/api/Search/
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface GeocodingResult {
  displayName: string;
  latitude: number;
  longitude: number;
  // bounding box: south, north, west, east
  bbox?: [number, number, number, number];
  type: string;
}

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
  type: string;
}

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    'accept-language': 'uk',
    countrycodes: 'ua',
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    signal,
    headers: {
      // Nominatim просить вказувати referer/UA для ідентифікації
      'Accept': 'application/json',
    },
  });

  if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);

  const data = (await response.json()) as NominatimItem[];

  return data.map((item) => ({
    displayName: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    bbox: item.boundingbox
      ? [
          parseFloat(item.boundingbox[0]),
          parseFloat(item.boundingbox[1]),
          parseFloat(item.boundingbox[2]),
          parseFloat(item.boundingbox[3]),
        ]
      : undefined,
    type: item.type,
  }));
}
