import type { Metadata } from "next";
import Link from "next/link";
import { CATALOG, CATEGORIES, MAKES, USE_CASES } from "@/data/catalog";
import { issuesFor } from "@/data/issues";
import { marketStats } from "@/lib/listings";
import { scoreFor } from "@/lib/reviews";
import { first, usd } from "@/lib/format";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { Stars } from "@/components/Stars";
import { VehicleArt } from "@/components/VehicleArt";

export const metadata: Metadata = { title: "Research models" };
type SP = Record<string, string | string[] | undefined>;

export default async function ResearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const cat = first(sp.category);
  const make = first(sp.make);
  const use = first(sp.useCase);
  const maxMsrp = Number(first(sp.maxMsrp) ?? 0);
  const sort = first(sp.sort) ?? "rating";

  const rows = CATALOG.filter(
    (m) => (!cat || m.category === cat) && (!make || m.make === make) && (!use || m.useCases.includes(use as never)) && (!maxMsrp || m.msrp <= maxMsrp),
  ).map((m) => {
    const issues = issuesFor(m.slug);
    return {
      m,
      s: scoreFor(m.slug),
      market: marketStats(m.slug),
      majors: issues.filter((i) => i.severity === "major").length,
      issueCount: issues.length,
    };
  });
  const sorters: Record<string, (a: (typeof rows)[0], b: (typeof rows)[0]) => number> = {
    rating: (a, b) => b.s.avg - a.s.avg,
    reliability: (a, b) => b.s.sub.reliability - a.s.sub.reliability,
    value: (a, b) => b.s.sub.value - a.s.sub.value,
    "price-asc": (a, b) => a.m.msrp - b.m.msrp,
    issues: (a, b) => a.majors - b.majors || a.issueCount - b.issueCount,
  };
  rows.sort(sorters[sort] ?? sorters.rating);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Research &amp; compare</h1>
          <p className="mt-1 text-slate-500">Owner ratings, known issues and real market prices for every model.</p>
        </div>
        <Link href="/reviews" className="btn-ghost">Browse all owner reviews →</Link>
      </div>

      <AutoSubmitForm className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="label" htmlFor="c">Type</label>
          <select id="c" name="category" defaultValue={cat ?? ""} className="field">
            <option value="">All types</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.plural}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="mk">Make</label>
          <select id="mk" name="make" defaultValue={make ?? ""} className="field">
            <option value="">All makes</option>
            {MAKES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="u">Best for</label>
          <select id="u" name="useCase" defaultValue={use ?? ""} className="field">
            <option value="">Any riding</option>
            {USE_CASES.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="mx">New price up to</label>
          <select id="mx" name="maxMsrp" defaultValue={first(sp.maxMsrp) ?? ""} className="field">
            <option value="">Any</option>
            {[8000, 10000, 15000, 20000, 25000, 35000].map((v) => <option key={v} value={v}>{usd(v)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="s">Sort by</label>
          <select id="s" name="sort" defaultValue={sort} className="field">
            <option value="rating">Owner rating</option>
            <option value="reliability">Reliability</option>
            <option value="value">Value</option>
            <option value="issues">Fewest serious issues</option>
            <option value="price-asc">Lowest MSRP</option>
          </select>
        </div>
      </AutoSubmitForm>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ m, s, market, majors, issueCount }) => (
          <Link key={m.slug} href={`/research/${m.slug}`} className="card group flex flex-col overflow-hidden transition hover:shadow-md">
            <VehicleArt category={m.category} className="h-36" />
            <div className="flex flex-1 flex-col p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{m.segment}</div>
              <h2 className="text-lg font-bold group-hover:text-brand-600">{m.make} {m.model}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <Stars value={s.avg} className="text-sm" />
                <b>{s.avg.toFixed(1)}</b>
                <span className="text-slate-500">· {s.count} reviews · {s.recommendPct}% recommend</span>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-50 p-2"><dt className="text-slate-500">Reliability</dt><dd className="text-base font-bold">{s.sub.reliability.toFixed(1)}</dd></div>
                <div className="rounded-lg bg-slate-50 p-2"><dt className="text-slate-500">Value</dt><dd className="text-base font-bold">{s.sub.value.toFixed(1)}</dd></div>
                <div className={`rounded-lg p-2 ${majors ? "bg-red-50" : "bg-slate-50"}`}><dt className="text-slate-500">Known issues</dt><dd className="text-base font-bold">{issueCount}{majors ? <span className="text-red-600"> ({majors}!)</span> : ""}</dd></div>
              </dl>
              <div className="mt-auto flex justify-between pt-3 text-sm">
                <span className="text-slate-500">New from <b className="text-slate-800">{usd(m.msrp)}</b></span>
                {market.usedCount > 0 && <span className="text-slate-500">Used avg <b className="text-slate-800">{usd(market.avg)}</b></span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
