import { Redis } from '@upstash/redis';
import type { POI } from './types';

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

let client: Redis | null = null;

function getClient(): Redis | null {
  if (client) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}

export function cacheKey(lat: number, lng: number, radiusKm: number): string {
  const lat3 = lat.toFixed(3);
  const lng3 = lng.toFixed(3);
  const r1 = (Math.round(radiusKm * 2) / 2).toFixed(1);
  return `scout:poi:v1:${lat3}:${lng3}:${r1}`;
}

export async function getCachedPOIs(key: string): Promise<POI[] | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    const value = await redis.get<POI[] | string>(key);
    if (value == null) return null;
    if (typeof value === 'string') {
      return JSON.parse(value) as POI[];
    }
    return value;
  } catch {
    return null;
  }
}

export async function setCachedPOIs(key: string, pois: POI[]): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(pois), { ex: TTL_SECONDS });
  } catch {
    // Cache write failures are non-fatal.
  }
}
