import type { POI } from './types';
import { matchedTag } from './overpass-tags';
import { haversineMetres, bearing } from './distance';

export async function getPOIs(lat: number, lng: number, radiusM: number): Promise<POI[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radiusM.toString(),
  });

  const res = await fetch(`/api/scout/overpass?${params}`, {
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const code = (json as { error?: string }).error;
    throw new Error(code === 'overpass_unavailable' ? 'overpass_unavailable' : `overpass_error_${res.status}`);
  }

  const json = await res.json() as { elements: Array<{
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

  return Array.from(seen.values()).sort((a, b) => a.distance - b.distance);
}
