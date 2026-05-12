import { NextRequest, NextResponse } from 'next/server';
import { fetchWikidataPOIs, WikidataError } from '../../../scout/lib/wikidata';
import { cacheKey, getCachedPOIs, setCachedPOIs } from '../../../scout/lib/poiCache';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const radiusKm = parseFloat(searchParams.get('radiusKm') ?? '');

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    Number.isNaN(radiusKm) ||
    radiusKm <= 0 ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json({ error: 'bad_params' }, { status: 400 });
  }

  const key = cacheKey(lat, lng, radiusKm);

  const cached = await getCachedPOIs(key);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'x-cache': 'hit' } });
  }

  try {
    const pois = await fetchWikidataPOIs(lat, lng, radiusKm);
    await setCachedPOIs(key, pois);
    return NextResponse.json(pois, { headers: { 'x-cache': 'miss' } });
  } catch (err) {
    const reason =
      err instanceof WikidataError
        ? err.kind === 'http'
          ? `wikidata_${err.status ?? 'http'}`
          : err.kind
        : 'unknown';
    return NextResponse.json({ error: 'wikidata_unavailable', reason }, { status: 503 });
  }
}
