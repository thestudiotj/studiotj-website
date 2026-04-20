import type { DriveInfo } from './types';
import { haversineMetres } from './distance';

const cache = new Map<string, { data: DriveInfo; ts: number }>();

function cacheKey(oLat: number, oLng: number, tLat: number, tLng: number) {
  return `${oLat.toFixed(3)},${oLng.toFixed(3)}-${tLat.toFixed(3)},${tLng.toFixed(3)}`;
}

export async function getDriveInfo(
  originLat: number, originLng: number,
  targetLat: number, targetLng: number,
): Promise<DriveInfo> {
  const key = cacheKey(originLat, originLng, targetLat, targetLng);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 15 * 60 * 1000) return cached.data;

  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${targetLng},${targetLat}?overview=false`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

  const straightLineKm = haversineMetres(originLat, originLng, targetLat, targetLng) / 1000;

  if (!res.ok) {
    return { straightLineKm, driveDistanceKm: straightLineKm * 1.3, durationMinutes: Math.round((straightLineKm / 60) * 60) };
  }

  const json = await res.json();
  const route = json.routes?.[0];
  const driveInfo: DriveInfo = {
    straightLineKm,
    driveDistanceKm: route ? route.distance / 1000 : straightLineKm * 1.3,
    durationMinutes: route ? Math.round(route.duration / 60) : Math.round((straightLineKm / 60) * 60),
  };

  cache.set(key, { data: driveInfo, ts: Date.now() });
  return driveInfo;
}
