'use client';

import { useState, useCallback, useRef } from 'react';
import type { ScoutMode, LatLng, ScoutData } from '../lib/types';
import { getCurrentPosition } from '../lib/geolocation';
import { reverseGeocode } from '../lib/nominatim';
import { getSunTimes } from '../lib/suncalc-adapter';
import { getWeather } from '../lib/openmeteo';
import { getPOIs } from '../lib/overpass';
import { getDriveInfo } from '../lib/osrm';

export interface FetchStatus {
  geo: 'idle' | 'loading' | 'done' | 'error';
  weather: 'idle' | 'loading' | 'done' | 'error';
  pois: 'idle' | 'loading' | 'done' | 'error';
  drive: 'idle' | 'loading' | 'done' | 'error' | 'skip';
}

export interface ScoutState {
  data: ScoutData | null;
  status: FetchStatus;
  errors: Partial<Record<keyof FetchStatus, string>>;
  fetch: (params: FetchParams) => void;
  reset: () => void;
}

export interface FetchParams {
  mode: ScoutMode;
  target?: LatLng & { label: string };
  originOverride?: LatLng & { label: string };
  date: Date;
  radiusKm: number;
}

const IDLE_STATUS: FetchStatus = { geo: 'idle', weather: 'idle', pois: 'idle', drive: 'idle' };

export function useScoutData(): ScoutState {
  const [data, setData] = useState<ScoutData | null>(null);
  const [status, setStatus] = useState<FetchStatus>(IDLE_STATUS);
  const [errors, setErrors] = useState<Partial<Record<keyof FetchStatus, string>>>({});
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setData(null);
    setStatus(IDLE_STATUS);
    setErrors({});
  }, []);

  const fetch = useCallback(async (params: FetchParams) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const { mode, target, date, radiusKm } = params;
    setData(null);
    setErrors({});
    setStatus({ geo: 'loading', weather: 'idle', pois: 'idle', drive: mode === 'detour-to' ? 'idle' : 'skip' });

    // Step 1: resolve location
    let location: LatLng & { label: string };
    let origin: (LatLng & { label: string }) | undefined;

    try {
      if (mode === 'here-now') {
        const pos = await getCurrentPosition();
        const label = await reverseGeocode(pos.lat, pos.lng);
        location = { lat: pos.lat, lng: pos.lng, label };
      } else {
        if (!target) throw new Error('No target location provided');
        location = target;
      }
      if (mode === 'detour-to') {
        if (params.originOverride) {
          origin = params.originOverride;
        } else {
          const pos = await getCurrentPosition();
          const label = await reverseGeocode(pos.lat, pos.lng);
          origin = { lat: pos.lat, lng: pos.lng, label };
        }
      }
      if (abort.signal.aborted) return;
    } catch (err) {
      setStatus(s => ({ ...s, geo: 'error' }));
      setErrors(e => ({ ...e, geo: (err as Error).message }));
      return;
    }

    // Step 2: sun times are synchronous — set initial data immediately so sun renders right away
    const sunTimes = getSunTimes(location.lat, location.lng, date);
    setData({ mode, location, origin, targetDate: date, sunTimes, weather: [], pois: [], driveInfo: undefined });
    setStatus(s => ({ ...s, geo: 'done', weather: 'loading', pois: 'loading' }));

    // Step 3: weather, POIs, and drive info run independently — each updates data as it lands
    const radiusM = radiusKm * 1000;

    const weatherPromise = getWeather(location.lat, location.lng)
      .then(hours => {
        if (abort.signal.aborted) return;
        const filtered = filterWeatherHours(hours, mode, date);
        setData(d => d ? { ...d, weather: filtered } : null);
        setStatus(s => ({ ...s, weather: 'done' }));
      })
      .catch(err => {
        if (abort.signal.aborted) return;
        setStatus(s => ({ ...s, weather: 'error' }));
        setErrors(e => ({ ...e, weather: (err as Error).message }));
      });

    const poisPromise = getPOIs(location.lat, location.lng, radiusM)
      .then(results => {
        if (abort.signal.aborted) return;
        setData(d => d ? { ...d, pois: results } : null);
        setStatus(s => ({ ...s, pois: 'done' }));
      })
      .catch(err => {
        if (abort.signal.aborted) return;
        setStatus(s => ({ ...s, pois: 'error' }));
        setErrors(e => ({ ...e, pois: (err as Error).message }));
      });

    const drivePromise = (mode === 'detour-to' && origin)
      ? getDriveInfo(origin.lat, origin.lng, location.lat, location.lng)
          .then(info => {
            if (abort.signal.aborted) return;
            setData(d => d ? { ...d, driveInfo: info } : null);
            setStatus(s => ({ ...s, drive: 'done' }));
          })
          .catch(err => {
            if (abort.signal.aborted) return;
            setStatus(s => ({ ...s, drive: 'error' }));
            setErrors(e => ({ ...e, drive: (err as Error).message }));
          })
      : Promise.resolve();

    await Promise.all([weatherPromise, poisPromise, drivePromise]);
  }, []);

  return { data, status, errors, fetch, reset };
}

function filterWeatherHours(
  hours: Awaited<ReturnType<typeof getWeather>>,
  mode: ScoutMode,
  date: Date,
) {
  const now = new Date();
  if (mode === 'here-now') {
    const cutoff = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    return hours.filter(h => h.time >= now && h.time <= cutoff);
  }
  const dayStart = new Date(date);
  dayStart.setHours(6, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(22, 0, 0, 0);
  const dateStr = date.toLocaleDateString('en-CA');
  return hours.filter(h => {
    const hStr = h.time.toLocaleDateString('en-CA');
    return hStr === dateStr && h.time >= dayStart && h.time <= dayEnd;
  });
}
