import type { WeatherHour } from './types';

const BASE = 'https://api.open-meteo.com/v1/forecast';

const cache = new Map<string, { data: WeatherHour[]; ts: number }>();

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

const WMO_LABELS: Record<number, string> = {
  0: 'clear', 1: 'mainly clear', 2: 'p.cloudy', 3: 'overcast',
  45: 'fog', 48: 'fog', 51: 'drizzle', 53: 'drizzle', 55: 'drizzle',
  61: 'rain', 63: 'rain', 65: 'h.rain', 71: 'snow', 73: 'snow', 75: 'h.snow',
  80: 'showers', 81: 'showers', 82: 'h.showers',
  95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
};

export function wmoLabel(code: number): string {
  return WMO_LABELS[code] ?? `code${code}`;
}

export async function getWeather(lat: number, lng: number): Promise<WeatherHour[]> {
  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 15 * 60 * 1000) return cached.data;

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    hourly: 'temperature_2m,cloud_cover,precipitation_probability,weather_code,wind_speed_10m',
    forecast_days: '2',
    timezone: 'auto',
  });

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo failed: ${res.status}`);
  const json = await res.json();

  const { time, temperature_2m, cloud_cover, precipitation_probability, weather_code, wind_speed_10m } = json.hourly;
  const hours: WeatherHour[] = (time as string[]).map((t, i) => ({
    time: new Date(t),
    temperature: Math.round(temperature_2m[i]),
    cloudCover: cloud_cover[i],
    precipitationProbability: precipitation_probability[i],
    weatherCode: weather_code[i],
    windSpeed: Math.round(wind_speed_10m[i]),
  }));

  cache.set(key, { data: hours, ts: Date.now() });
  return hours;
}
