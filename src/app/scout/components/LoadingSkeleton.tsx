export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-2 rounded-lg bg-white/5 p-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-4 rounded bg-white/10" style={{ width: `${60 + (i * 7) % 40}%` }} />
      ))}
    </div>
  );
}
