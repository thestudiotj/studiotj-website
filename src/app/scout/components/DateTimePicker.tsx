'use client';

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
}

export default function DateTimePicker({ value, onChange, label = 'Date' }: Props) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-white/60 whitespace-nowrap">{label}</label>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/50 min-h-[44px] [color-scheme:dark]"
      />
    </div>
  );
}
