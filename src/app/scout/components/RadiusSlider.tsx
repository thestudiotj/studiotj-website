'use client';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export default function RadiusSlider({ value, min, max, step = 0.5, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-white/60 whitespace-nowrap">Radius</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-white"
      />
      <span className="text-sm text-white min-w-[3.5rem] text-right">{value.toFixed(1)} km</span>
    </div>
  );
}
