import type { Metadata } from "next";
import Link from "next/link";
import { CATALOG, CATEGORIES, MAKES, categoryLabel, type Category } from "@/data/catalog";
import { CITIES, DEAL_RATINGS, filterListings } from "@/lib/listings";
import { all, first, withParams } from "@/lib/format";
import { CollapsibleFilters } from "@/components/CollapsibleFilters";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { ListingCard } from "@/components/ListingCard";
import { DealBadge } from "@/components/DealBadge";

export const metadata: Metadata = { title: "Powersports for sale" };

type SP = Record<string, string | string[] | undefined>;
const PAGE_SIZE = 20;

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const n = (k: string) => (first(sp[k]) ? Number(first(sp[k])) : undefined);
  const category = first(sp.category) as Category | undefined;
  const makes = all(sp.make).filter(Boolean);
  const deals = all(sp.deal).filter(Boolean);
  const near = first(sp.near);
  const page = Math.max(1, n("page") ?? 1);

  const rows = filterListings({
    q: first(sp.q),
    category,
    make: makes,
    model: first(sp.model),
    condition: first(sp.condition),
    deal: deals,
    minPrice: n("minPrice"),
    maxPrice: n("maxPrice"),
    minYear: n("minYear"),
    maxYear: n("maxYear"),
    maxUsage: n("maxUsage"),
    near,
    radius: n("radius"),
    seller: first(sp.seller),
    sort: first(sp.sort),
  });
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const models = CATALOG.filter((m) => (!category || m.category === category) && (!makes.length || makes.includes(m.make)));
  const usageLabel = category === "atv" || category === "sxs" ? "Max hours" : category ? "Max miles" : "Max hours / miles";
  const dealCounts = Object.fromEntries(DEAL_RATINGS.map((d) => [d.id, rows.filter((r) => r.deal === d.id).length]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">
        {category ? `${categoryLabel(category)}s` : "Powersports"} for sale
        {makes.length === 1 && <span className="text-slate-500"> · {makes[0]}</span>}
      </h1>
      <p className="mt-1 text-slate-500">{rows.length} matches · every listing rated against estimated market value</p>

      <AutoSubmitForm className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <CollapsibleFilters>
        <aside className="card space-y-5 p-5">
          <div className="flex items-center justify-between">
            <span className="font-bold">Filters</span>
            <Link href="/listings" className="text-xs font-semibold text-brand-600 hover:underline">Clear all</Link>
          </div>
          <div>
            <label className="label" htmlFor="q">Keyword</label>
            <input id="q" name="q" defaultValue={first(sp.q)} placeholder="RZR, Grizzly, turbo…" className="field" />
          </div>
          <div>
            <span className="label">Type</span>
            <div className="grid grid-cols-2 gap-1.5">
              <Radio name="category" value="" label="All" checked={!category} />
              {CATEGORIES.map((c) => <Radio key={c.id} name="category" value={c.id} label={c.plural} checked={category === c.id} />)}
            </div>
          </div>
          <div>
            <span className="label">Deal rating</span>
            <div className="space-y-1.5">
              {DEAL_RATINGS.map((d) => (
                <label key={d.id} className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" name="deal" value={d.id} defaultChecked={deals.includes(d.id)} className="accent-brand-500" />
                    <DealBadge deal={d.id} />
                  </span>
                  <span className="text-xs text-slate-400">{dealCounts[d.id]}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Make</span>
            <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-auto">
              {MAKES.map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" name="make" value={m} defaultChecked={makes.includes(m)} className="accent-brand-500" /> {m}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="model">Model</label>
            <select id="model" name="model" defaultValue={first(sp.model) ?? ""} className="field">
              <option value="">Any model</option>
              {models.map((m) => <option key={m.slug} value={m.slug}>{m.make} {m.model}</option>)}
            </select>
          </div>
          <div>
            <span className="label">Condition</span>
            <div className="grid grid-cols-3 gap-1.5">
              <Radio name="condition" value="" label="Any" checked={!first(sp.condition)} />
              <Radio name="condition" value="used" label="Used" checked={first(sp.condition) === "used"} />
              <Radio name="condition" value="new" label="New" checked={first(sp.condition) === "new"} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="minPrice">Min price</label>
              <input id="minPrice" name="minPrice" type="number" step="500" defaultValue={first(sp.minPrice)} placeholder="$0" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="maxPrice">Max price</label>
              <input id="maxPrice" name="maxPrice" type="number" step="500" defaultValue={first(sp.maxPrice)} placeholder="Any" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="minYear">Min year</label>
              <input id="minYear" name="minYear" type="number" defaultValue={first(sp.minYear)} placeholder="2012" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="maxYear">Max year</label>
              <input id="maxYear" name="maxYear" type="number" defaultValue={first(sp.maxYear)} placeholder="2026" className="field" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="maxUsage">{usageLabel}</label>
            <input id="maxUsage" name="maxUsage" type="number" defaultValue={first(sp.maxUsage)} placeholder="Any" className="field" />
          </div>
          <div className="grid grid-cols-[1fr_96px] gap-2">
            <div>
              <label className="label" htmlFor="near">Near</label>
              <select id="near" name="near" defaultValue={near ?? ""} className="field">
                <option value="">Anywhere</option>
                {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}, {c.state}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="radius">Radius</label>
              <select id="radius" name="radius" defaultValue={first(sp.radius) ?? "250"} className="field">
                {[50, 100, 250, 500, 1000].map((r) => <option key={r} value={r}>{r} mi</option>)}
              </select>
            </div>
          </div>
          <div>
            <span className="label">Seller</span>
            <div className="grid grid-cols-3 gap-1.5">
              <Radio name="seller" value="" label="Any" checked={!first(sp.seller)} />
              <Radio name="seller" value="dealer" label="Dealer" checked={first(sp.seller) === "dealer"} />
              <Radio name="seller" value="private" label="Private" checked={first(sp.seller) === "private"} />
            </div>
          </div>
          <noscript><button className="btn-primary w-full">Apply filters</button></noscript>
        </aside>
        </CollapsibleFilters>

        {/* Results */}
        <section className="min-w-0 transition-opacity [[data-pending]_&]:opacity-50">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {makes.map((m) => <span key={m} className="chip">{m}</span>)}
              {deals.map((d) => <DealBadge key={d} deal={d as never} />)}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Sort</span>
              <select name="sort" defaultValue={first(sp.sort) ?? "best"} className="field w-auto">
                <option value="best">Best deals first</option>
                <option value="price-asc">Lowest price</option>
                <option value="price-desc">Highest price</option>
                <option value="year-desc">Newest year</option>
                <option value="usage-asc">Lowest hours / miles</option>
                <option value="newest">Newest listings</option>
                {near && <option value="closest">Closest</option>}
              </select>
            </label>
          </div>
          {shown.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">
              No matches. Try widening the radius or removing a filter.
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map((l) => <ListingCard key={l.id} l={l} distance={l.distance} />)}
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-2 text-sm">
              {page > 1 && <Link className="btn-ghost" href={`/listings${withParams(sp, { page: String(page - 1) })}`}>← Prev</Link>}
              <span className="text-slate-500">Page {page} of {pages}</span>
              {page < pages && <Link className="btn-ghost" href={`/listings${withParams(sp, { page: String(page + 1) })}`}>Next →</Link>}
            </nav>
          )}
        </section>
      </AutoSubmitForm>
    </div>
  );
}

function Radio({ name, value, label, checked }: { name: string; value: string; label: string; checked: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="block rounded-md border border-slate-200 px-2 py-1.5 text-center text-xs font-medium text-slate-600 peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-100">
        {label}
      </span>
    </label>
  );
}
