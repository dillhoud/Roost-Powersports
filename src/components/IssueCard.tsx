import clsx from "clsx";
import type { CommonIssue } from "@/data/issues";
import { shortDate } from "@/lib/format";

function hostLabel(url: string, n: number) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const sub = host === "reddit.com" ? u.pathname.match(/\/r\/([^/]+)/)?.[1] : undefined;
    return sub ? `r/${sub}` : host;
  } catch {
    return `Source ${n + 1}`;
  }
}

const SEV: Record<CommonIssue["severity"], string> = {
  major: "bg-red-500/15 text-red-300 border-red-500/30",
  moderate: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  minor: "bg-carbon-800 text-zinc-200 border-carbon-800",
};
const KIND: Record<CommonIssue["kind"], string> = {
  recall: "Recall",
  "service-bulletin": "Service bulletin",
  "owner-reported": "Owner-reported",
};

export function yearInRange(years: string, y: number) {
  if (years === "All") return true;
  const m = years.match(/(\d{4})(?:–(\d{4}))?/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : a;
  return y >= a && y <= b;
}

export function IssueCard({ issue, highlightYear, showModel }: { issue: CommonIssue; highlightYear?: number; showModel?: string }) {
  const affects = highlightYear !== undefined && yearInRange(issue.years, highlightYear);
  return (
    <div className={clsx("rounded-sm border p-4", affects ? "border-amber-500/40 bg-amber-500/5" : "border-carbon-800 bg-carbon-900")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={clsx("rounded border px-1.5 py-0.5 text-[11px] font-bold uppercase", SEV[issue.severity])}>{issue.severity}</span>
        <span className="chip">{KIND[issue.kind]}</span>
        <span className="chip">Years: {issue.years}</span>
        {affects && <span className="chip border-amber-500/40 bg-amber-500/15 text-amber-300">May affect this year</span>}
      </div>
      {showModel && <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{showModel}</div>}
      <h3 className="mt-1 font-bold">{issue.title}</h3>
      <p className="mt-1 text-sm text-zinc-400"><b className="text-zinc-100">Symptoms:</b> {issue.symptoms}</p>
      <p className="mt-1 text-sm text-zinc-400"><b className="text-zinc-100">Common fix:</b> {issue.fix}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>Typical cost: <b className="text-zinc-200">{issue.estCost}</b></span>
        <span>~{issue.mentions} owner discussions</span>
        <span>Sources: {issue.sources.join(", ")}</span>
        {issue.lastVerified && <span>Checked {shortDate(issue.lastVerified)}</span>}
      </div>
      {issue.sourceUrls && issue.sourceUrls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {issue.sourceUrls.map((u, n) => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-brand-400 hover:underline">
              {hostLabel(u, n)} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
