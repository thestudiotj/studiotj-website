'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { NominatimResult } from '../lib/types';
import { searchLocation } from '../lib/nominatim';

interface Props {
  onSelect: (result: { lat: number; lng: number; label: string }) => void;
  placeholder?: string;
}

const LAT_LNG_RE = /^(-?\d{1,3}\.?\d*)\s*,\s*(-?\d{1,3}\.?\d*)$/;

export default function LocationInput({ onSelect, placeholder = 'Search location…' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [selected, setSelected] = useState<{ label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    const latLngMatch = q.match(LAT_LNG_RE);
    if (latLngMatch) {
      const lat = parseFloat(latLngMatch[1]);
      const lng = parseFloat(latLngMatch[2]);
      onSelect({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      setSelected({ label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      setOpen(false);
      return;
    }
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await searchLocation(q);
      setResults(res);
      setOpen(res.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  function handleSelect(r: NominatimResult) {
    const label = r.display_name.split(',').slice(0, 3).join(',').trim();
    onSelect({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), label });
    setSelected({ label });
    setQuery('');
    setOpen(false);
  }

  function handleClear() {
    setSelected(null);
    setQuery('');
    setResults([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm">
        <span className="flex-1 text-white truncate">{selected.label}</span>
        <button onClick={handleClear} className="text-white/50 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Clear">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 min-h-[44px]"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">…</span>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg bg-zinc-800 border border-white/20 overflow-hidden">
          {results.map(r => (
            <li key={r.place_id}>
              <button
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-3 text-sm text-white/80 hover:bg-white/10 min-h-[44px]"
              >
                {r.display_name.split(',').slice(0, 4).join(', ')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
