import { haversineMetres, bearing } from './distance';
import type { POI } from './types';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT =
  'StudioTJ-Scout/1.0 (https://studiotj.com; contact: thestudiotj@gmail.com)';
const TIMEOUT_MS = 10_000;
const RESULT_LIMIT = 80;

const SPARQL_TEMPLATE = `SELECT DISTINCT ?item ?itemLabel ?coord ?typeLabel ?heritage WHERE {
  SERVICE wikibase:around {
    ?item wdt:P625 ?coord .
    bd:serviceParam wikibase:center "Point({LON} {LAT})"^^geo:wktLiteral .
    bd:serviceParam wikibase:radius "{RADIUS_KM}" .
  }
  ?item wdt:P31 ?type .
  VALUES ?type {
    wd:Q41176
    wd:Q811979
    wd:Q16970
    wd:Q132510
    wd:Q108325
    wd:Q44613
    wd:Q23413
    wd:Q57821
    wd:Q1763828
    wd:Q12518
    wd:Q12280
    wd:Q4989906
    wd:Q15243209
    wd:Q839954
    wd:Q39614
    wd:Q570116
    wd:Q1066907
  }
  OPTIONAL { ?item wdt:P1435 ?heritage . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "nl,en". }
}
LIMIT ${RESULT_LIMIT}`;

interface SparqlBinding {
  item?: { value: string };
  itemLabel?: { value: string };
  coord?: { value: string };
  typeLabel?: { value: string };
  heritage?: { value: string };
}

interface SparqlResponse {
  results?: { bindings?: SparqlBinding[] };
}

export class WikidataError extends Error {
  constructor(
    message: string,
    public readonly kind: 'timeout' | 'http' | 'parse',
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'WikidataError';
  }
}

function buildQuery(lat: number, lng: number, radiusKm: number): string {
  return SPARQL_TEMPLATE
    .replace('{LON}', lng.toString())
    .replace('{LAT}', lat.toString())
    .replace('{RADIUS_KM}', radiusKm.toString());
}

function parseCoord(wkt: string): { lat: number; lng: number } | null {
  const match = wkt.match(/Point\(([\d.\-]+) ([\d.\-]+)\)/);
  if (!match) return null;
  const lng = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;
  return { lat, lng };
}

function qidFromUri(uri: string): string {
  const tail = uri.split('/').pop();
  return tail ?? uri;
}

export async function fetchWikidataPOIs(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<POI[]> {
  const query = buildQuery(lat, lng, radiusKm);
  const body = `query=${encodeURIComponent(query)}`;

  let res: Response;
  try {
    res = await fetch(SPARQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/sparql-results+json',
        'User-Agent': USER_AGENT,
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    throw new WikidataError(
      name === 'TimeoutError' || name === 'AbortError'
        ? 'Wikidata request timed out'
        : `Wikidata fetch failed: ${(err as Error).message}`,
      'timeout',
    );
  }

  if (!res.ok) {
    throw new WikidataError(`Wikidata HTTP ${res.status}`, 'http', res.status);
  }

  let json: SparqlResponse;
  try {
    json = (await res.json()) as SparqlResponse;
  } catch {
    throw new WikidataError('Wikidata response was not JSON', 'parse');
  }

  const bindings = json.results?.bindings ?? [];
  const seen = new Set<string>();
  const pois: POI[] = [];

  for (const b of bindings) {
    if (!b.item?.value || !b.coord?.value) continue;
    const id = qidFromUri(b.item.value);
    if (seen.has(id)) continue;
    const coord = parseCoord(b.coord.value);
    if (!coord) continue;
    seen.add(id);

    const name = b.itemLabel?.value ?? id;
    const type = b.typeLabel?.value ?? 'place';
    const heritage = !!b.heritage?.value;
    const distanceM = haversineMetres(lat, lng, coord.lat, coord.lng);
    const bear = bearing(lat, lng, coord.lat, coord.lng);

    pois.push({
      id,
      name,
      lat: coord.lat,
      lng: coord.lng,
      type,
      heritage,
      distanceM,
      bearing: bear,
    });
  }

  pois.sort((a, b) => a.distanceM - b.distanceM);
  return pois;
}
