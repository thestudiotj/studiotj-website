'use client';

import type { ScoutMode } from '../lib/types';

const MODES: { id: ScoutMode; label: string }[] = [
  { id: 'here-now', label: 'Here Now' },
  { id: 'trip-to', label: 'Trip To' },
  { id: 'detour-to', label: 'Detour To' },
];

interface Props {
  value: ScoutMode;
  onChange: (mode: ScoutMode) => void;
}

export default function ModeSelector({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-white/20 overflow-hidden">
      {MODES.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 min-h-[44px] px-3 py-2 text-sm font-medium transition-colors ${
            value === id
              ? 'bg-white text-black'
              : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
