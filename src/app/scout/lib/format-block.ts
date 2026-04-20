import type { ScoutData, SunTimes, WeatherHour, POI } from './types';
import { wmoLabel } from './openmeteo';
import { formatDistance } from './distance';

const MAX_POIS = 20;

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' })
    .replace(' ', ' ');
}

function fmtHour(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).slice(0, 2) + 'h';
}

function fmtDate(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const iso = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  return `${iso} (${days[d.getDay()]})`;
}

function sunBlock(sun: SunTimes, label: string): string {
  return [
    `Light ${label}`,
    `- Sunrise ${fmtTime(sun.sunrise)} | Sunset ${fmtTime(sun.sunset)}`,
    `- Golden morning ${fmtTime(sun.goldenHourMorningStart)}–${fmtTime(sun.goldenHourMorningEnd)} | Golden eve ${fmtTime(sun.goldenHourEveningStart)}–${fmtTime(sun.goldenHourEveningEnd)}`,
    `- Blue morning ${fmtTime(sun.blueMorningStart)}–${fmtTime(sun.blueMorningEnd)} | Blue eve ${fmtTime(sun.blueEveningStart)}–${fmtTime(sun.blueEveningEnd)}`,
  ].join('\n');
}

function weatherBlock(hours: WeatherHour[], label: string): string {
  if (!hours.length) return `Weather ${label}\n- No data`;
  const lines = hours.map(h =>
    `- ${fmtHour(h.time)}: ${h.temperature}°C ${wmoLabel(h.weatherCode)}, cloud ${h.cloudCover}%, precip ${h.precipitationProbability}%`
  );
  return [`Weather ${label}`, ...lines].join('\n');
}

function poisBlock(pois: POI[], radiusKm: number, failed?: boolean): string {
  const header = `Nearby POIs (${radiusKm}km, photography-tagged)`;
  if (failed) return `${header}\n- unavailable (public OSM servers under heavy load)`;
  const shown = pois.slice(0, MAX_POIS);
  const remaining = pois.length - shown.length;
  const lines = shown.map(p => `- ${p.name} (${p.matchedTag}, ${formatDistance(p.distance)} ${p.bearing})`);
  if (remaining > 0) lines.push(`[${remaining} more]`);
  return [header, ...lines].join('\n');
}

export function formatBlock(data: ScoutData, radiusKm: number, poisFailed?: boolean): string {
  const { mode, location, origin, targetDate, sunTimes, weather, pois, driveInfo } = data;
  const parts: string[] = ['## Scouting Context'];

  if (mode === 'here-now') {
    const now = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const nowStr = now.toLocaleString('en-GB', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12: false, timeZone: tz }).replace(',', '');
    parts.push(
      `Mode: here-now`,
      `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} (${location.label})`,
      `Now: ${nowStr}`,
    );
    if (sunTimes) parts.push('', sunBlock(sunTimes, 'today'));
    if (weather.length) parts.push('', weatherBlock(weather, 'next 6h'));
  } else if (mode === 'trip-to') {
    parts.push(
      `Mode: trip-to`,
      `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} (${location.label})`,
      `Target date: ${fmtDate(targetDate)}`,
    );
    if (sunTimes) parts.push('', sunBlock(sunTimes, `on ${targetDate.toLocaleDateString('en-CA')}`));
    if (weather.length) parts.push('', weatherBlock(weather, `on ${targetDate.toLocaleDateString('en-CA')} (daylight)`));
  } else {
    const straight = driveInfo ? `${driveInfo.straightLineKm.toFixed(1)}km straight` : '';
    const drive = driveInfo ? `, ~${driveInfo.durationMinutes} min drive` : '';
    parts.push(
      `Mode: detour-to`,
      `Origin: ${origin!.lat.toFixed(4)}, ${origin!.lng.toFixed(4)} (${origin!.label})`,
      `Target: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} (${location.label}) — ${straight}${drive}`,
      `Target date: ${fmtDate(targetDate)}`,
    );
    if (sunTimes) parts.push('', sunBlock(sunTimes, `at target on ${targetDate.toLocaleDateString('en-CA')}`));
    if (weather.length) parts.push('', weatherBlock(weather, `at target on ${targetDate.toLocaleDateString('en-CA')}`));
  }

  parts.push('', poisBlock(pois, radiusKm, poisFailed));
  return parts.join('\n');
}
