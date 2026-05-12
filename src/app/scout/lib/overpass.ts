// Client-side POI fetcher.
// Despite the filename, this now calls /api/scout/pois (Wikidata-backed).
// Filename kept to avoid churn in imports; the function is source-agnostic.
import type { POI } from './types';

export async function getPOIs(lat: number, lng: number, radiusKm: number): Promise<POI[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radiusKm: radiusKm.toString(),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(`/api/scout/pois?${params}`, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('pois_unavailable');
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const code = (json as { error?: string }).error;
    throw new Error(code === 'wikidata_unavailable' ? 'pois_unavailable' : `pois_error_${res.status}`);
  }

  const pois = (await res.json()) as POI[];
  return pois;
}
