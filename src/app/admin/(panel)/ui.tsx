export function StatusPill({ live }: { live: boolean }) {
  return live ? (
    <span className="rounded-sm bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">Live</span>
  ) : (
    <span className="rounded-sm bg-carbon-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">Draft</span>
  );
}

export function Flash({ sp }: { sp: Record<string, string | undefined> }) {
  const msg = sp.saved ? "Saved — the public site is updated." : sp.deleted ? "Deleted." : sp.checked ? "Checked every offer page." : sp.added ? "Page added and checked. It will be checked again every morning." : sp.updated ? "Saved." : null;
  if (sp.error) return <p className="mt-4 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{sp.error}</p>;
  if (!msg) return null;
  return <p className="mt-4 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{msg}</p>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-600">{hint}</span>}
    </label>
  );
}

const SOURCE_PILL: Record<string, [string, string]> = {
  changed: ["Changed", "bg-amber-500/15 text-amber-300"],
  ok: ["No change", "bg-emerald-500/15 text-emerald-400"],
  error: ["Can't check", "bg-red-500/15 text-red-300"],
  new: ["Not checked yet", "bg-carbon-700 text-zinc-400"],
};

export function SourcePill({ status, needsReview }: { status: string; needsReview: boolean }) {
  const [label, cls] = SOURCE_PILL[needsReview ? "changed" : status] ?? SOURCE_PILL.new;
  return <span className={`whitespace-nowrap rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${cls}`}>{label}</span>;
}

export function ago(d: Date | null) {
  if (!d) return "never";
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 36) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} days ago`;
}
