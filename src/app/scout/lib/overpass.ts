import type { POI } from './types';
import { buildOverpassQuery, matchedTag } from './overpass-tags';
import { haversineMetres, bearing } from './distance';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const cache = new Map<string, { data: POI[]; ts: number }>();

function cacheKey(lat: number, lng: number, radiusM: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)},${radiusM}`;
}

async function fetchOverpass(query: string): Promise<unknown> {
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) return res.json();
    } catch {
      // try next mirror
    }
  }
  throw new Error('All Overpass endpoints failed');
}

export async function getPOIs(lat: number, lng: number, radiusM: number): Promise<POI[]> {
  const key = cacheKey(lat, lng, radiusM);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 15 * 60 * 1000) return cached.data;

  const query = buildOverpassQuery(lat, lng, radiusM);
  const json = await fetchOverpass(query) as { elements: Array<{
    id: number; type: string; tags?: Record<string, string>;
    lat?: number; lon?: number; center?: { lat: number; lon: number };
  }> };

  const seen = new Map<string, POI>();

  for (const el of json.elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    if (!name) continue;

    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat == null || elLng == null) continue;

    const dist = haversineMetres(lat, lng, elLat, elLng);
    const bear = bearing(lat, lng, elLat, elLng);
    const tag = matchedTag(tags);

    const dedupeKey = name.toLowerCase();
    const existing = seen.get(dedupeKey);
    if (existing && haversineMetres(existing.lat, existing.lng, elLat, elLng) < 50) continue;

    seen.set(dedupeKey, {
      id: `${el.type}/${el.id}`,
      name,
      lat: elLat,
      lng: elLng,
      tags,
      matchedTag: tag,
      distance: dist,
      bearing: bear,
    });
  }

  const pois = Array.from(seen.values()).sort((a, b) => a.distance - b.distance);
  cache.set(key, { data: pois, ts: Date.now() });
  return pois;
}
