import Link from "next/link";
import { CollapsibleFilters } from "./CollapsibleFilters";
import { CATEGORIES, MAKES, USE_CASES, CATALOG } from "@/data/catalog";
import { EXPERIENCE, SUB_LABELS, SUB_RATINGS } from "@/lib/reviews";
import { all, first } from "@/lib/format";

type SP = Record<string, string | string[] | undefined>;

/** Review filters. When `fixedModel` is set (model page) the model/make/type controls are hidden. */
export function ReviewFilterPanel({ sp, clearHref, fixedModel }: { sp: SP; clearHref: string; fixedModel?: boolean }) {
  const makes = all(sp.make);
  const category = first(sp.category);
  return (
    <CollapsibleFilters label="Review filters">
    <aside className="card space-y-5 p-5">
      <div className="flex items-center justify-between">
        <span className="font-bold">Filter reviews</span>
        <Link href={clearHref} scroll={false} className="text-xs font-semibold text-brand-600 hover:underline">Clear</Link>
      </div>
      <div>
        <label className="label" htmlFor="rq">Search in reviews</label>
        <input id="rq" name="q" defaultValue={first(sp.q)} placeholder="belt, heat, dealer, clutch…" className="field" />
      </div>
      {!fixedModel && (
        <>
          <div>
            <label className="label" htmlFor="rcat">Type</label>
            <select id="rcat" name="category" defaultValue={category ?? ""} className="field">
              <option value="">All types</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.plural}</option>)}
            </select>
          </div>
          <div>
            <span className="label">Make</span>
            <div className="grid grid-cols-2 gap-1.5">
              {MAKES.map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" name="make" value={m} defaultChecked={makes.includes(m)} className="accent-brand-500" /> {m}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="rmodel">Model</label>
            <select id="rmodel" name="model" defaultValue={first(sp.model) ?? ""} className="field">
              <option value="">Any model</option>
              {CATALOG.filter((m) => (!category || m.category === category) && (!makes.length || makes.includes(m.make))).map((m) => (
                <option key={m.slug} value={m.slug}>{m.make} {m.model}</option>
              ))}
            </select>
          </div>
        </>
      )}
      <div>
        <span className="label">Minimum rating</span>
        <div className="grid grid-cols-5 gap-1">
          {["", "2", "3", "4", "5"].map((v) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="minRating" value={v} defaultChecked={(first(sp.minRating) ?? "") === v} className="peer sr-only" />
              <span className="block rounded-md border border-slate-200 py-1.5 text-center text-xs font-semibold text-slate-600 peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700">
                {v ? `${v}★+` : "Any"}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="ruse">How they ride</label>
        <select id="ruse" name="useCase" defaultValue={first(sp.useCase) ?? ""} className="field">
          <option value="">Any riding style</option>
          {USE_CASES.map((u) => <option key={u}>{u}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="rexp">Rider experience</label>
        <select id="rexp" name="experience" defaultValue={first(sp.experience) ?? ""} className="field">
          <option value="">Any level</option>
          {EXPERIENCE.map((e) => <option key={e}>{e}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="rminyear">Model year from</label>
        <input id="rminyear" name="minYear" type="number" defaultValue={first(sp.minYear)} placeholder="Any" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="rfocus">What matters most to you</label>
        <select id="rfocus" name="focus" defaultValue={first(sp.focus) ?? ""} className="field">
          <option value="">— Use sort order —</option>
          {SUB_RATINGS.map((k) => <option key={k} value={k}>Best {SUB_LABELS[k].toLowerCase()} first</option>)}
        </select>
      </div>
      <div className="space-y-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="verified" value="1" defaultChecked={first(sp.verified) === "1"} className="accent-brand-500" />
          Verified owners only
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="issues" value="1" defaultChecked={first(sp.issues) === "1"} className="accent-brand-500" />
          Only reviews that mention problems
        </label>
      </div>
      <noscript><button className="btn-primary w-full">Apply</button></noscript>
    </aside>
    </CollapsibleFilters>
  );
}

export function ReviewSort({ sp }: { sp: SP }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">Sort</span>
      <select name="sort" defaultValue={first(sp.sort) ?? "helpful"} className="field w-auto">
        <option value="helpful">Most helpful</option>
        <option value="newest">Newest</option>
        <option value="highest">Highest rated</option>
        <option value="lowest">Lowest rated</option>
        <option value="most-used">Longest owned</option>
      </select>
    </label>
  );
}

export function parseReviewFilters(sp: SP) {
  const n = (k: string) => (first(sp[k]) ? Number(first(sp[k])) : undefined);
  return {
    q: first(sp.q),
    category: first(sp.category),
    make: all(sp.make).filter(Boolean),
    model: first(sp.model),
    minRating: n("minRating"),
    useCase: first(sp.useCase),
    experience: first(sp.experience),
    minYear: n("minYear"),
    verified: first(sp.verified) === "1",
    mentionsIssues: first(sp.issues) === "1",
    focus: (first(sp.focus) || undefined) as (typeof SUB_RATINGS)[number] | undefined,
    sort: first(sp.sort),
  };
}
