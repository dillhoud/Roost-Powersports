export function Stars({ value, className = "text-base" }: { value: number; className?: string }) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <span className={`relative inline-block leading-none tracking-tight ${className}`} aria-label={`${value.toFixed(1)} out of 5`}>
      <span className="text-slate-300">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

export function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 text-slate-600">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-amber-400" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="w-8 text-right font-semibold tabular-nums">{value.toFixed(1)}</span>
    </div>
  );
}
