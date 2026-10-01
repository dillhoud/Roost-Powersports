import Link from "next/link";
import { CATALOG, CATEGORIES, MAKES } from "@/data/catalog";
import { ISSUES } from "@/data/issues";
import { PROMOS, promoTypeLabel } from "@/data/promos";
import { allListings, CITIES } from "@/lib/listings";
import { scoreFor } from "@/lib/reviews";
import { usd, daysUntil } from "@/lib/format";
import { ListingCard } from "@/components/ListingCard";
import { VehicleArt } from "@/components/VehicleArt";
import { Stars } from "@/components/Stars";

export default function Home() {
  const listings = allListings();
  const topDeals = listings
    .filter((l) => l.deal === "great" && l.condition === "used" && l.titleStatus === "Clean")
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 4);
  const topRated = CATALOG.map((m) => ({ m, s: scoreFor(m.slug) }))
    .sort((a, b) => b.s.avg - a.s.avg)
    .slice(0, 6);
  const promos = [...PROMOS].filter((p) => ["military", "first-responder", "pro", "ag"].includes(p.type)).slice(0, 4);
  const bigRebates = [...PROMOS].filter((p) => p.type === "rebate").sort((a, b) => b.value - a.value).slice(0, 3);

  return (
    <>
      {/* Hero + search */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 md:pt-16">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Find the right machine. <span className="text-brand-500">Know the real price.</span> Avoid the lemons.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            ATVs, side-by-sides, snowmobiles &amp; motorcycles — with deal ratings on every listing, owner reviews you can actually filter,
            the common problems riders report for each model, and every brand discount in one place.
          </p>

          <form action="/listings" className="mt-8 grid gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-xl sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_1fr_auto]">
            <div>
              <label className="label" htmlFor="h-cat">Type</label>
              <select id="h-cat" name="category" className="field">
                <option value="">All types</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.plural}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="h-make">Make</label>
              <select id="h-make" name="make" className="field">
                <option value="">All makes</option>
                {MAKES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="h-q">Model or keyword</label>
              <input id="h-q" name="q" placeholder="e.g. RZR, Grizzly, Ténéré" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="h-near">Near</label>
              <select id="h-near" name="near" className="field">
                <option value="">Anywhere</option>
                {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}, {c.state}</option>)}
              </select>
              <input type="hidden" name="radius" value="250" />
            </div>
            <button className="btn-primary h-[38px] self-end px-6">Search</button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <span className="text-slate-400">Popular:</span>
            {[
              ["Great-deal side-by-sides", "/listings?category=sxs&deal=great"],
              ["Utility ATVs under $8k", "/listings?category=atv&maxPrice=8000"],
              ["Mountain sleds", "/listings?category=snowmobile&q=summit"],
              ["Adventure bikes", "/listings?category=motorcycle&q=adventure"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:border-brand-500 hover:text-white">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto -mt-6 grid max-w-7xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={`/listings?category=${c.id}`} className="card group overflow-hidden transition hover:shadow-md">
            <VehicleArt category={c.id} className="h-28" />
            <div className="p-3">
              <div className="font-bold group-hover:text-brand-600">{c.plural}</div>
              <div className="text-xs text-slate-500">{listings.filter((l) => l.model.category === c.id).length} for sale · {c.blurb}</div>
            </div>
          </Link>
        ))}
      </section>

      {/* Value props */}
      <section className="mx-auto mt-12 grid max-w-7xl gap-4 px-4 md:grid-cols-4">
        {[
          ["Deal ratings", "Every listing is priced against estimated market value for its year, hours/miles and condition.", "/listings"],
          ["Filterable reviews", "Filter owner reviews by riding style, experience level, model year and verified ownership.", "/research"],
          ["Known issues", `${ISSUES.length} common problems compiled from rider communities, with fixes and costs.`, "/issues"],
          ["Every discount", "Rebates, promo APR, plus military, first-responder, ag and pro programs by brand.", "/deals"],
        ].map(([t, d, href]) => (
          <Link key={t} href={href} className="card p-5 transition hover:border-brand-500">
            <div className="text-sm font-bold text-brand-600">{t}</div>
            <p className="mt-1 text-sm text-slate-600">{d}</p>
          </Link>
        ))}
      </section>

      {/* Top deals */}
      <section className="mx-auto mt-14 max-w-7xl px-4">
        <SectionHead title="Today's best used deals" href="/listings?condition=used&deal=great" link="See all great deals" />
        <div className="grid gap-4 lg:grid-cols-2">
          {topDeals.map((l) => <ListingCard key={l.id} l={l} />)}
        </div>
      </section>

      {/* Discounts strip */}
      <section className="mx-auto mt-14 max-w-7xl px-4">
        <SectionHead title="Current brand discounts" href="/deals" link="All deals & discounts" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr]">
          <div className="card p-5">
            <div className="text-sm font-semibold text-slate-500">Biggest rebates right now</div>
            <ul className="mt-3 divide-y divide-slate-100">
              {bigRebates.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-semibold">{p.make} · {p.title}</div>
                    <div className="text-xs text-slate-500">{p.models} · ends in {daysUntil(p.ends)} days</div>
                  </div>
                  <span className="whitespace-nowrap rounded-md bg-emerald-50 px-2 py-1 text-sm font-bold text-emerald-700">{p.amount}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
            <div className="text-sm font-semibold text-brand-500">Pro, military &amp; first-responder programs</div>
            <ul className="mt-3 space-y-3">
              {promos.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span><span className="font-semibold">{p.make}</span> <span className="text-slate-400">· {promoTypeLabel(p.type)}</span></span>
                  <span className="text-sm font-bold">{p.amount}</span>
                </li>
              ))}
            </ul>
            <Link href="/deals?type=pro&type=military&type=first-responder&type=ag" className="mt-4 inline-block text-sm font-semibold text-brand-500 hover:underline">
              Check what you qualify for →
            </Link>
          </div>
        </div>
      </section>

      {/* Top rated */}
      <section className="mx-auto mt-14 max-w-7xl px-4">
        <SectionHead title="Highest-rated by owners" href="/research?sort=rating" link="Research all models" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topRated.map(({ m, s }) => (
            <Link key={m.slug} href={`/research/${m.slug}`} className="card flex items-center gap-4 p-4 transition hover:shadow-md">
              <VehicleArt category={m.category} className="h-16 w-24 shrink-0 rounded-lg" />
              <div className="min-w-0">
                <div className="truncate font-bold">{m.make} {m.model}</div>
                <div className="flex items-center gap-2 text-sm">
                  <Stars value={s.avg} className="text-sm" />
                  <span className="font-semibold">{s.avg.toFixed(1)}</span>
                  <span className="text-slate-500">({s.count})</span>
                </div>
                <div className="text-xs text-slate-500">{m.segment} · from {usd(m.msrp)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function SectionHead({ title, href, link }: { title: string; href: string; link: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <Link href={href} className="whitespace-nowrap text-sm font-semibold text-brand-600 hover:underline">{link} →</Link>
    </div>
  );
}
