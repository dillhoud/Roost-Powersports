import type { Metadata } from "next";
import Link from "next/link";
import { CATALOG, CATEGORIES, MAKES, getModel } from "@/data/catalog";
import { ISSUES } from "@/data/issues";
import { first } from "@/lib/format";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { IssueCard } from "@/components/IssueCard";

export const metadata: Metadata = { title: "Common problems by make & model" };
type SP = Record<string, string | string[] | undefined>;

export default async function IssuesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = first(sp.q)?.toLowerCase().trim();
  const cat = first(sp.category);
  const make = first(sp.make);
  const model = first(sp.model);
  const sev = first(sp.severity);
  const kind = first(sp.kind);
  const year = Number(first(sp.year) ?? 0);
  const sort = first(sp.sort) ?? "severity";

  const sevOrder = { major: 0, moderate: 1, minor: 2 };
  const rows = ISSUES.map((i) => ({ i, m: getModel(i.modelSlug)! }))
    .filter(({ i, m }) => {
      if (cat && m.category !== cat) return false;
      if (make && m.make !== make) return false;
      if (model && i.modelSlug !== model) return false;
      if (sev && i.severity !== sev) return false;
      if (kind && i.kind !== kind) return false;
      if (year && i.years !== "All") {
        const r = i.years.match(/(\d{4})(?:–(\d{4}))?/);
        if (r && (year < Number(r[1]) || year > Number(r[2] ?? r[1]))) return false;
      }
      if (q && !`${i.title} ${i.symptoms} ${i.fix} ${m.make} ${m.model}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) =>
      sort === "mentions" ? b.i.mentions - a.i.mentions : sevOrder[a.i.severity] - sevOrder[b.i.severity] || b.i.mentions - a.i.mentions,
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Common problems by make &amp; model</h1>
      <p className="mt-1 max-w-3xl text-slate-500">
        The issues riders keep talking about on Reddit and model-specific forums, plus recalls and service bulletins —
        with symptoms, the usual fix and what it costs. Know what to check before you buy.
      </p>

      <AutoSubmitForm className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="iq">Search symptoms</label>
          <input id="iq" name="q" defaultValue={first(sp.q)} placeholder="belt, overheating, stalling, electrical…" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="ic">Type</label>
          <select id="ic" name="category" defaultValue={cat ?? ""} className="field">
            <option value="">All types</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.plural}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="im">Make</label>
          <select id="im" name="make" defaultValue={make ?? ""} className="field">
            <option value="">All makes</option>
            {MAKES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="imo">Model</label>
          <select id="imo" name="model" defaultValue={model ?? ""} className="field">
            <option value="">All models</option>
            {CATALOG.filter((m) => (!cat || m.category === cat) && (!make || m.make === make)).map((m) => (
              <option key={m.slug} value={m.slug}>{m.make} {m.model}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="iy">Model year</label>
          <input id="iy" name="year" type="number" defaultValue={first(sp.year)} placeholder="e.g. 2019" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="is">Severity</label>
          <select id="is" name="severity" defaultValue={sev ?? ""} className="field">
            <option value="">Any severity</option>
            <option value="major">Major</option>
            <option value="moderate">Moderate</option>
            <option value="minor">Minor</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ik">Source</label>
          <select id="ik" name="kind" defaultValue={kind ?? ""} className="field">
            <option value="">All</option>
            <option value="recall">Recalls</option>
            <option value="service-bulletin">Service bulletins</option>
            <option value="owner-reported">Owner-reported</option>
          </select>
        </div>
        <div className="flex items-end justify-between gap-2 sm:col-span-2 lg:col-span-4">
          <span className="text-sm text-slate-500">{rows.length} issues</span>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Sort</span>
            <select name="sort" defaultValue={sort} className="field w-auto">
              <option value="severity">Most severe first</option>
              <option value="mentions">Most discussed</option>
            </select>
          </label>
        </div>
      </AutoSubmitForm>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {rows.map(({ i, m }) => (
          <div key={i.id} className="flex flex-col">
            <IssueCard issue={i} showModel={`${m.make} ${m.model}`} highlightYear={year || undefined} />
            <Link href={`/research/${m.slug}`} className="mt-1 self-end text-xs font-semibold text-brand-600 hover:underline">
              {m.make} {m.model} full report →
            </Link>
          </div>
        ))}
      </div>
      {rows.length === 0 && <div className="card mt-6 p-10 text-center text-slate-500">No issues match — that&apos;s a good sign.</div>}
    </div>
  );
}
