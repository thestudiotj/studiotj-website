import type { NominatimResult } from './types';

const BASE = 'https://nominatim.openstreetmap.org';
const UA = 'StudioTJ-Scout/1.0 (info@studiotj.com)';

export async function searchLocation(query: string): Promise<NominatimResult[]> {
  if (query.trim().length < 3) return [];
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`);
  return res.json();
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `${BASE}/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
  if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const data = await res.json();
  const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? '';
  const country = data.address?.country_code?.toUpperCase() ?? '';
  if (city && country) return `${city}, ${country}`;
  return data.display_name?.split(',').slice(0, 2).join(',').trim() ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
