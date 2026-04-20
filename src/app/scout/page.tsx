'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ScoutMode } from './lib/types';
import ModeSelector from './components/ModeSelector';
import LocationInput from './components/LocationInput';
import RadiusSlider from './components/RadiusSlider';
import DateTimePicker from './components/DateTimePicker';
import ContextOutput from './components/ContextOutput';
import { useScoutData } from './hooks/useScoutData';

const DEFAULT_RADIUS: Record<ScoutMode, { value: number; min: number; max: number }> = {
  'here-now':   { value: 2,   min: 0.5, max: 5 },
  'trip-to':    { value: 3,   min: 1,   max: 10 },
  'detour-to':  { value: 1.5, min: 0.5, max: 5 },
};

function todayStr() {
  return new Date().toLocaleDateString('en-CA');
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA');
}

export default function ScoutPage() {
  const [mode, setMode] = useState<ScoutMode>('here-now');
  const [radius, setRadius] = useState(DEFAULT_RADIUS['here-now'].value);
  const [dateStr, setDateStr] = useState(todayStr());
  const [target, setTarget] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const { data, status, errors, fetch: doFetch, reset } = useScoutData();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset target and adjust defaults when mode changes
  useEffect(() => {
    setTarget(null);
    setRadius(DEFAULT_RADIUS[mode].value);
    setDateStr(mode === 'trip-to' ? tomorrowStr() : todayStr());
    reset();
    // Auto-trigger here-now immediately on mode entry
    if (mode === 'here-now') {
      doFetch({ mode, date: new Date(), radiusKm: DEFAULT_RADIUS['here-now'].value });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const runFetch = useCallback((overrideRadius?: number, overrideDateStr?: string) => {
    const r = overrideRadius ?? radius;
    const d = new Date(overrideDateStr ?? dateStr);
    if (mode === 'here-now') {
      doFetch({ mode, date: d, radiusKm: r });
    } else if (target) {
      doFetch({ mode, target, date: d, radiusKm: r });
    }
  }, [mode, radius, dateStr, target, doFetch]);

  // Debounce radius changes
  function handleRadiusChange(val: number) {
    setRadius(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runFetch(val), 300);
  }

  function handleDateChange(val: string) {
    setDateStr(val);
    runFetch(undefined, val);
  }

  function handleTargetSelect(t: { lat: number; lng: number; label: string }) {
    setTarget(t);
    const d = new Date(dateStr);
    doFetch({ mode, target: t, date: d, radiusKm: radius });
  }

  const cfg = DEFAULT_RADIUS[mode];

  return (
    <div className="min-h-screen bg-zinc-900 text-white px-4 pt-6 pb-16 max-w-lg mx-auto space-y-5">
      <header>
        <h1 className="text-lg font-semibold tracking-wide">Scout</h1>
        <p className="text-xs text-white/40 mt-0.5">StudioTJ scouting context builder</p>
      </header>

      <ModeSelector value={mode} onChange={setMode} />

      {(mode === 'trip-to' || mode === 'detour-to') && (
        <LocationInput
          onSelect={handleTargetSelect}
          placeholder={mode === 'detour-to' ? 'Search detour target…' : 'Search destination…'}
        />
      )}

      {mode !== 'here-now' && (
        <DateTimePicker
          value={dateStr}
          onChange={handleDateChange}
          label={mode === 'detour-to' ? 'Date' : 'Date'}
        />
      )}

      <RadiusSlider value={radius} min={cfg.min} max={cfg.max} onChange={handleRadiusChange} />

      {mode !== 'here-now' && target && (
        <button
          onClick={() => runFetch()}
          className="w-full min-h-[44px] rounded-lg bg-white/10 border border-white/20 text-sm text-white hover:bg-white/20 transition-colors"
        >
          Fetch data
        </button>
      )}

      <ContextOutput
        data={data}
        status={status}
        errors={errors}
        radiusKm={radius}
        onRegenerate={() => runFetch()}
      />
    </div>
  );
}
