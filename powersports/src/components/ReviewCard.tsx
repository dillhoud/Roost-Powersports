import Link from "next/link";
import type { Review } from "@/lib/reviews";
import { SUB_LABELS, SUB_RATINGS } from "@/lib/reviews";
import { num } from "@/lib/format";
import { Stars } from "./Stars";

function ago(days: number) {
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${(days / 365).toFixed(1)}y ago`;
}

export function ReviewCard({ r, showModel }: { r: Review; showModel?: boolean }) {
  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {showModel && (
            <Link href={`/research/${r.modelSlug}`} className="text-xs font-bold uppercase tracking-wide text-brand-600 hover:underline">
              {r.model.make} {r.model.model}
            </Link>
          )}
          <div className="flex items-center gap-2">
            <Stars value={r.rating} />
            <h3 className="font-bold">{r.title}</h3>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{r.author}</span>
            <span>{r.location}</span>
            <span>{r.modelYear} model</span>
            <span>Owned {r.ownedMonths >= 12 ? `${(r.ownedMonths / 12).toFixed(1)} yrs` : `${r.ownedMonths} mo`}</span>
            <span>{num(r.usage)} {r.usageUnit}</span>
            <span>{ago(r.daysAgo)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {r.verified && <span className="chip border-emerald-200 bg-emerald-50 text-emerald-700">✓ Verified owner</span>}
          <span className="chip">{r.useCase}</span>
          <span className="chip">{r.experience}</span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{r.body}</p>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div><span className="font-semibold text-emerald-700">+ Pros:</span> {r.pros}</div>
        <div><span className="font-semibold text-red-700">− Cons:</span> {r.cons}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {SUB_RATINGS.map((k) => (
          <span key={k}>{SUB_LABELS[k]} <b className="text-slate-700">{r.sub[k]}/5</b></span>
        ))}
        <span className="ml-auto">{r.recommend ? "👍 Recommends" : "👎 Doesn't recommend"} · {r.helpful} found helpful</span>
      </div>
    </article>
  );
}
