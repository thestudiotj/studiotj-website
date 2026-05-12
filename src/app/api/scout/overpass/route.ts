// Deferred — supplemental OSM enrichment.
// Not wired to the client. Primary POI source is Wikidata (/api/scout/pois).
import { NextRequest, NextResponse } from 'next/server';
import { buildOverpassQuery } from '../../../scout/lib/overpass-tags';

export const runtime = 'edge';

const PUBLIC_MIRRORS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const PER_MIRROR_MS = 6000;
const UA = 'StudioTJ-Scout/1.0 (https://studiotj.com)';
const CACHE_TTL = 15 * 60 * 1000;

// Best-effort: valid within a single warm edge function instance
const cache = new Map<string, { body: string; ts: number }>();

async function tryFetch(
  url: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return res;
  } catch {
    // fall through to next source
  }
  return null;
}

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

  // Self-hosted instance (primary) — gated by CF Access service token
  const selfHosted = process.env.OVERPASS_ENDPOINT;
  const cfId = process.env.CF_ACCESS_CLIENT_ID;
  const cfSecret = process.env.CF_ACCESS_CLIENT_SECRET;

  if (selfHosted && cfId && cfSecret) {
    const res = await tryFetch(
      selfHosted,
      postBody,
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        'CF-Access-Client-Id': cfId,
        'CF-Access-Client-Secret': cfSecret,
      },
      PER_MIRROR_MS,
    );
    if (res) {
      const text = await res.text();
      cache.set(cacheKey, { body: text, ts: Date.now() });
      return new NextResponse(text, { headers: { 'Content-Type': 'application/json' } });
    }
  }

  // Public mirrors (fallback)
  for (const mirror of PUBLIC_MIRRORS) {
    const res = await tryFetch(
      mirror,
      postBody,
      { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
      PER_MIRROR_MS,
    );
    if (res) {
      const text = await res.text();
      cache.set(cacheKey, { body: text, ts: Date.now() });
      return new NextResponse(text, { headers: { 'Content-Type': 'application/json' } });
    }
  }

  const mirrorCount = PUBLIC_MIRRORS.length + (selfHosted ? 1 : 0);
  return NextResponse.json(
    { error: 'overpass_unavailable', mirrors_tried: mirrorCount },
    { status: 503 },
  );
}
