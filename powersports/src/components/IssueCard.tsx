import clsx from "clsx";
import type { CommonIssue } from "@/data/issues";

const SEV: Record<CommonIssue["severity"], string> = {
  major: "bg-red-100 text-red-800 border-red-200",
  moderate: "bg-amber-100 text-amber-800 border-amber-200",
  minor: "bg-slate-100 text-slate-700 border-slate-200",
};
const KIND: Record<CommonIssue["kind"], string> = {
  recall: "Recall",
  "service-bulletin": "Service bulletin",
  "owner-reported": "Owner-reported",
};

function yearInRange(years: string, y: number) {
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
    <div className={clsx("rounded-lg border p-4", affects ? "border-amber-300 bg-amber-50/40" : "border-slate-200 bg-white")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={clsx("rounded border px-1.5 py-0.5 text-[11px] font-bold uppercase", SEV[issue.severity])}>{issue.severity}</span>
        <span className="chip">{KIND[issue.kind]}</span>
        <span className="chip">Years: {issue.years}</span>
        {affects && <span className="chip border-amber-300 bg-amber-100 text-amber-800">May affect this year</span>}
      </div>
      {showModel && <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{showModel}</div>}
      <h3 className="mt-1 font-bold">{issue.title}</h3>
      <p className="mt-1 text-sm text-slate-600"><b className="text-slate-800">Symptoms:</b> {issue.symptoms}</p>
      <p className="mt-1 text-sm text-slate-600"><b className="text-slate-800">Common fix:</b> {issue.fix}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>Typical cost: <b className="text-slate-700">{issue.estCost}</b></span>
        <span>~{issue.mentions} owner discussions</span>
        <span>Sources: {issue.sources.join(", ")}</span>
      </div>
    </div>
  );
}
