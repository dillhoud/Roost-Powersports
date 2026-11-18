import type { Metadata } from "next";
import Link from "next/link";
import { CATALOG, CATEGORIES, categoryLabel, type VehicleModel } from "@/data/catalog";
import { getIssues, getPromos } from "@/lib/content";
import { MAX_COMPARE, compareHref, parseCompare, popularMatchups, rivals } from "@/lib/compare";
import { estPayment } from "@/lib/finance";
import { all, cad, num } from "@/lib/format";
import { CURRENT_YEAR, estimateMarketValue, expectedUsagePerYear, marketStats } from "@/lib/listings";
import { SUB_LABELS, SUB_RATINGS, scoreFor } from "@/lib/reviews";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { Stars } from "@/components/Stars";
import { VehicleArt } from "@/components/VehicleArt";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const ms = parseCompare(all((await searchParams).m));
  return {
    title: ms.length > 1 ? ms.map((m) => m.model).join(" vs ") : "Compare models",
    description: "Compare ATVs, side-by-sides, snowmobiles and motorcycles side by side: Canadian prices, owner ratings, reliability, known issues and resale value.",
  };
}

type Better = "high" | "low";
interface Row {
  label: string;
  hint?: string;
  cells: React.ReactNode[];
  /** Numbers used to pick the best cell; undefined = not compared. */
  score?: (number | undefined)[];
  better?: Better;
}

async function dataFor(m: VehicleModel) {
  const [issues, promos] = await Promise.all([getIssues(m.slug), getPromos(m.make)]);
  const offers = promos.filter((p) => p.categories.includes(m.category)).sort((a, b) => b.value - a.value);
  const serious = issues.filter((i) => i.severity === "major" || i.kind === "recall");
  const threeYear = estimateMarketValue(m, CURRENT_YEAR - 3, expectedUsagePerYear(m.category) * 3, "used");
  const threeYearMsrp = m.msrp * Math.pow(0.975, 3);
  return {
    m,
    s: scoreFor(m.slug),
    market: marketStats(m.slug),
    issues,
    serious,
    offers,
    payment: estPayment(m.msrp),
    retained: Math.round((threeYear / threeYearMsrp) * 100),
    threeYear,
  };
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ms = parseCompare(all(sp.m));
  const data = await Promise.all(ms.map(dataFor));
  const mixed = new Set(ms.map((m) => m.category)).size > 1;
  const slugs = ms.map((m) => m.slug);
  const suggestions = ms.length && ms.length < MAX_COMPARE ? rivals(ms[0], 4).filter((r) => !slugs.includes(r.slug)).slice(0, 3) : [];

  const rows: Row[] = data.length
    ? [
        { label: "New price (base MSRP)", cells: data.map((d) => cad(d.m.msrp)), score: data.map((d) => d.m.msrp), better: "low" },
        { label: "Est. monthly payment", hint: "New, 20% down, 60 months, good credit", cells: data.map((d) => `${cad(d.payment)}/mo`), score: data.map((d) => d.payment), better: "low" },
        { label: "Used, average asking", cells: data.map((d) => (d.market.usedCount ? cad(d.market.avg) : "—")) },
        { label: "Owner rating", cells: data.map((d) => (<span key="r" className="inline-flex items-center gap-1.5"><Stars value={d.s.avg} className="text-sm" /> <b>{d.s.avg.toFixed(1)}</b></span>)), score: data.map((d) => Math.round(d.s.avg * 10)), better: "high" },
        { label: "Would recommend", cells: data.map((d) => `${d.s.recommendPct}%`), score: data.map((d) => d.s.recommendPct), better: "high" },
        ...SUB_RATINGS.map((k): Row => ({ label: SUB_LABELS[k], cells: data.map((d) => d.s.sub[k].toFixed(1)), score: data.map((d) => Math.round(d.s.sub[k] * 10)), better: "high" })),
        {
          label: "Serious known issues",
          hint: "Major problems and recalls",
          cells: data.map((d) => (d.serious.length ? `${d.serious.length} of ${d.issues.length}` : `None of ${d.issues.length}`)),
          score: data.map((d) => d.serious.length),
          better: "low",
        },
        {
          label: "Most-reported problems",
          cells: data.map((d) =>
            d.issues.length ? (
              <ul key="i" className="space-y-1">{d.issues.slice(0, 3).map((i) => <li key={i.id} className={i.severity === "major" ? "text-red-300" : ""}>• {i.title}</li>)}</ul>
            ) : "None tracked",
          ),
        },
        { label: "Loses per year", cells: data.map((d) => `~${Math.round(d.m.depreciation * 100)}%`), score: data.map((d) => d.m.depreciation), better: "low" },
        {
          label: "Value after 3 years",
          hint: "Typical use, private sale",
          cells: data.map((d) => (<span key="v">{cad(d.threeYear)} <span className="text-zinc-500">({d.retained}% kept)</span></span>)),
          score: data.map((d) => d.retained),
          better: "high",
        },
        { label: "Engine", cells: data.map((d) => d.m.engine) },
        { label: "Horsepower", cells: data.map((d) => (d.m.hp ? `${d.m.hp} hp` : "—")), score: data.map((d) => d.m.hp), better: "high" },
        { label: "Seats", cells: data.map((d) => d.m.seats ?? (d.m.category === "motorcycle" ? 2 : 1)) },
        { label: "Best for", cells: data.map((d) => d.m.useCases.join(", ")) },
        {
          label: "Current offers",
          cells: data.map((d) =>
            d.offers.length ? (
              <span key="o"><b className="text-emerald-400">{d.offers[0].amount}</b><span className="block text-xs text-zinc-500">{d.offers[0].title}{d.offers.length > 1 ? ` + ${d.offers.length - 1} more` : ""}</span></span>
            ) : "None right now",
          ),
        },
        {
          label: "For sale now",
          cells: data.map((d) => (
            <Link key="l" href={`/listings?model=${d.m.slug}`} className="font-semibold text-brand-400 hover:underline">
              {num(d.market.count)} listed{d.market.greatDeals ? ` · ${d.market.greatDeals} good deals` : ""} →
            </Link>
          )),
        },
        {
          label: "Owners like",
          cells: data.map((d) => <ul key="p" className="space-y-1">{d.m.pros.map((p) => <li key={p}><span className="font-bold text-emerald-400">+</span> {p}</li>)}</ul>),
        },
        {
          label: "Owners don't like",
          cells: data.map((d) => <ul key="c" className="space-y-1">{d.m.cons.map((p) => <li key={p}><span className="font-bold text-red-400">−</span> {p}</li>)}</ul>),
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="display text-5xl text-white md:text-6xl">{ms.length > 1 ? ms.map((m) => m.model).join(" vs ") : "Compare models"}</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">
        Pick up to {MAX_COMPARE} models. The best in each row is highlighted, and the link is shareable.
      </p>

      <AutoSubmitForm className="card mt-6 grid gap-3 p-4 sm:grid-cols-3">
        {Array.from({ length: MAX_COMPARE }, (_, i) => (
          <select key={`${i}-${slugs[i] ?? ""}`} name="m" defaultValue={slugs[i] ?? ""} aria-label={`Model ${i + 1}`} className="field">
            <option value="">{i === 0 ? "Choose a model…" : "Add a model…"}</option>
            {CATEGORIES.map((c) => (
              <optgroup key={c.id} label={c.plural}>
                {CATALOG.filter((x) => x.category === c.id).map((x) => (
                  <option key={x.slug} value={x.slug}>{x.make} {x.model}</option>
                ))}
              </optgroup>
            ))}
          </select>
        ))}
        <noscript><button className="btn-primary sm:col-span-3">Compare</button></noscript>
      </AutoSubmitForm>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-zinc-500">Add a rival:</span>
          {suggestions.map((r) => (
            <Link key={r.slug} href={compareHref([...slugs, r.slug])} className="chip px-3 py-1 hover:border-brand-500 hover:text-white">+ {r.make} {r.model}</Link>
          ))}
        </div>
      )}

      {mixed && (
        <p className="mt-4 rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          You&apos;re comparing different types of machine, so prices, horsepower and resale aren&apos;t like for like.
        </p>
      )}

      {data.length > 0 ? (
        <>
        {data.length > 1 && <p className="mt-6 text-xs text-zinc-500 sm:hidden">Swipe the table sideways to see every model →</p>}
        <div className="mt-2 overflow-x-auto rounded-sm border border-carbon-800 transition-opacity sm:mt-6 [[data-pending]_&]:opacity-50">
          <table className="w-full table-fixed border-collapse text-sm" style={{ minWidth: `${130 + data.length * 210}px` }}>
            <thead>
              <tr className="bg-carbon-900">
                <th className="sticky left-0 z-10 w-[130px] bg-carbon-900 p-3 text-left align-bottom text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:w-[200px]">
                  {data.length === 1 ? "Add another model above" : ""}
                </th>
                {data.map((d) => (
                  <th key={d.m.slug} className="border-l border-carbon-800 p-3 text-left align-top font-normal">
                    <VehicleArt category={d.m.category} className="h-24 rounded-sm" />
                    <div className="mt-2 text-xs text-zinc-500">{categoryLabel(d.m.category)} · {d.m.segment}</div>
                    <Link href={`/research/${d.m.slug}`} className="block font-display text-xl font-bold uppercase italic leading-tight text-white hover:text-brand-400">
                      {d.m.make} {d.m.model}
                    </Link>
                    <Link href={compareHref(slugs.filter((s) => s !== d.m.slug))} className="mt-1 inline-block text-xs text-zinc-500 hover:text-white">✕ Remove</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const best = bestIndexes(r);
                return (
                  <tr key={r.label} className="border-t border-carbon-800 bg-carbon-950 even:bg-carbon-900/40">
                    <th scope="row" className="sticky left-0 z-10 bg-carbon-950 p-3 text-left align-top text-xs font-semibold text-zinc-300 sm:text-sm">
                      {r.label}
                      {r.hint && <span className="block text-xs font-normal text-zinc-600">{r.hint}</span>}
                    </th>
                    {r.cells.map((c, i) => (
                      <td key={i} className={`border-l border-carbon-800 p-3 align-top ${best.has(i) ? "bg-emerald-500/10 font-semibold text-emerald-300" : "text-zinc-300"}`}>
                        {c}
                        {best.has(i) && <span className="ml-2 rounded-sm bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Best</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <section className="mt-10">
          <h2 className="eyebrow text-zinc-500">Popular matchups</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularMatchups().map((set) => (
              <Link key={set[0].slug} href={compareHref(set.map((m) => m.slug))} className="card p-4 transition hover:border-brand-500">
                <div className="text-xs text-zinc-500">{categoryLabel(set[0].category)}</div>
                <div className="mt-1 font-semibold text-white">{set.map((m) => m.model).join(" vs ")}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.length > 0 && (
        <p className="mt-4 text-xs leading-relaxed text-zinc-600">
          Ratings come from owner reviews. Prices are approximate Canadian MSRPs; payments and resale are estimates. Confirm with a dealer.
        </p>
      )}
    </div>
  );
}

/** Which cells are best in a row (ties all count); none when the row isn't compared or everything is equal. */
function bestIndexes(r: Row) {
  const out = new Set<number>();
  if (!r.score || !r.better || r.score.length < 2) return out;
  const vals = r.score.filter((v): v is number => v !== undefined);
  if (vals.length < 2) return out;
  const target = r.better === "high" ? Math.max(...vals) : Math.min(...vals);
  if (vals.every((v) => v === target)) return out;
  r.score.forEach((v, i) => v === target && out.add(i));
  return out;
}
