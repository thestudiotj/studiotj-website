import { NextRequest, NextResponse } from 'next/server';
import { buildOverpassQuery } from '../../../scout/lib/overpass-tags';

export const runtime = 'edge';

const MIRRORS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const PER_MIRROR_MS = 8000;
const UA = 'StudioTJ-Scout/1.0 (https://studiotj.com)';
const CACHE_TTL = 15 * 60 * 1000;

// Best-effort: valid within a single warm edge function instance
const cache = new Map<string, { body: string; ts: number }>();

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const radius = parseFloat(searchParams.get('radius') ?? '');

  if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
    return NextResponse.json({ error: 'bad_params' }, { status: 400 });
  }

  const cacheKey = `${lat.toFixed(3)}-${lng.toFixed(3)}-${radius}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new NextResponse(cached.body, { headers: { 'Content-Type': 'application/json' } });
  }

  const query = buildOverpassQuery(lat, lng, radius);
  const postBody = `data=${encodeURIComponent(query)}`;

  for (const mirror of MIRRORS) {
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: postBody,
        signal: AbortSignal.timeout(PER_MIRROR_MS),
      });
      if (res.ok) {
        const text = await res.text();
        cache.set(cacheKey, { body: text, ts: Date.now() });
        return new NextResponse(text, { headers: { 'Content-Type': 'application/json' } });
      }
    } catch {
      // try next mirror
    }
  }

  return NextResponse.json(
    { error: 'overpass_unavailable', mirrors_tried: MIRRORS.length },
    { status: 503 },
  );
}
