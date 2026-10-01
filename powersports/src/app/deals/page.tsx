import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/data/catalog";
import { PROMOS, PROMO_TYPES, promoTypeLabel } from "@/data/promos";
import { all, daysUntil, first, shortDate } from "@/lib/format";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";

export const metadata: Metadata = { title: "Current deals, rebates & pro discounts" };
type SP = Record<string, string | string[] | undefined>;

const TYPE_STYLE: Record<string, string> = {
  rebate: "bg-emerald-100 text-emerald-800",
  financing: "bg-sky-100 text-sky-800",
  pro: "bg-violet-100 text-violet-800",
  military: "bg-lime-100 text-lime-800",
  "first-responder": "bg-red-100 text-red-800",
  ag: "bg-amber-100 text-amber-800",
  loyalty: "bg-slate-200 text-slate-800",
  racer: "bg-orange-100 text-orange-800",
};

export default async function DealsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const types = all(sp.type).filter(Boolean);
  const make = first(sp.make);
  const cat = first(sp.category);
  const sort = first(sp.sort) ?? "value";
  const makes = Array.from(new Set(PROMOS.map((p) => p.make))).sort();

  const rows = PROMOS.filter(
    (p) => (!types.length || types.includes(p.type)) && (!make || p.make === make) && (!cat || p.categories.includes(cat as never)) && daysUntil(p.ends) >= 0,
  ).sort((a, b) => (sort === "ending" ? a.ends.localeCompare(b.ends) : b.value - a.value));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Deals, rebates &amp; pro discounts</h1>
      <p className="mt-1 max-w-3xl text-slate-500">
        Every manufacturer offer in one place — cash rebates, promo financing, and the programs most buyers miss:
        pro/industry, military, first responder, farm &amp; ag, loyalty and racer contingency. Many stack with a dealer discount.
      </p>

      <AutoSubmitForm className="card mt-6 space-y-4 p-4">
        <div>
          <span className="label">I am / I want…</span>
          <div className="flex flex-wrap gap-2">
            {PROMO_TYPES.map((t) => (
              <label key={t.id} className="cursor-pointer" title={t.description}>
                <input type="checkbox" name="type" value={t.id} defaultChecked={types.includes(t.id)} className="peer sr-only" />
                <span className="block rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-100">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="dm">Brand</label>
            <select id="dm" name="make" defaultValue={make ?? ""} className="field">
              <option value="">All brands</option>
              {makes.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dc">Vehicle type</label>
            <select id="dc" name="category" defaultValue={cat ?? ""} className="field">
              <option value="">All types</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.plural}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ds">Sort</label>
            <select id="ds" name="sort" defaultValue={sort} className="field">
              <option value="value">Biggest savings</option>
              <option value="ending">Ending soonest</option>
            </select>
          </div>
        </div>
      </AutoSubmitForm>

      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Offers change monthly and vary by region and dealer. Use <b>Verify</b> to confirm on the brand&apos;s site before you go in — and ask the dealer which programs stack.
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((p) => {
          const left = daysUntil(p.ends);
          return (
            <div key={p.id} className="card flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{p.make}</span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${TYPE_STYLE[p.type]}`}>{promoTypeLabel(p.type)}</span>
              </div>
              <h2 className="mt-2 font-bold">{p.title}</h2>
              <div className="mt-1 text-2xl font-extrabold text-emerald-700">{p.amount}</div>
              {p.models && <div className="mt-1 text-sm text-slate-600">{p.models}</div>}
              <p className="mt-2 text-sm text-slate-600"><b className="text-slate-800">Who qualifies:</b> {p.eligibility}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.categories.map((c) => <span key={c} className="chip">{CATEGORIES.find((x) => x.id === c)?.plural}</span>)}
              </div>
              <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                <span className={left <= 14 ? "font-semibold text-red-600" : "text-slate-500"}>
                  Ends {shortDate(p.ends)}{left <= 14 ? ` · ${left}d left` : ""}
                </span>
                <span className="flex gap-3">
                  <Link href={`/listings?make=${encodeURIComponent(p.make)}${p.categories.length === 1 ? `&category=${p.categories[0]}` : ""}&condition=new`} className="font-semibold text-slate-700 hover:underline">Shop</Link>
                  <a href={p.verifyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">Verify ↗</a>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {rows.length === 0 && <div className="card mt-6 p-10 text-center text-slate-500">No active offers match those filters.</div>}
    </div>
  );
}
