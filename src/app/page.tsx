import Link from "next/link";
import { CATALOG, CATEGORIES, MAKES, getModel, type Category } from "@/data/catalog";
import { ISSUES } from "@/data/issues";
import { PROMOS, promoTypeLabel } from "@/data/promos";
import { allListings, CITIES, DEAL_RATINGS, type Listing } from "@/lib/listings";
import { scoreFor } from "@/lib/reviews";
import { daysUntil, num, shortDate, usd } from "@/lib/format";

const SHORT: Record<Category, string> = { atv: "ATV", sxs: "SXS", snowmobile: "Snow", motorcycle: "Moto" };

export default function Home() {
  const listings = allListings();
  const cleanUsed = listings.filter((l) => l.condition === "used" && l.titleStatus === "Clean");
  const bySavingsPct = [...cleanUsed].sort((a, b) => b.savings / b.marketValue - a.savings / a.marketValue);
  const featured = bySavingsPct[0];
  // One deal per category so the row isn't all side-by-sides.
  const deals = CATEGORIES.map((c) => bySavingsPct.find((l) => l.model.category === c.id && l.id !== featured.id)).filter(Boolean) as Listing[];
  const issues = [...ISSUES].sort((a, b) => b.mentions - a.mentions).slice(0, 6);
  const offers = [...PROMOS].sort((a, b) => b.value - a.value).slice(0, 7);
  const ranked = CATALOG.map((m) => ({ m, s: scoreFor(m.slug) }))
    .sort((a, b) => b.s.sub.reliability - a.s.sub.reliability)
    .slice(0, 5);
  const underMarket = listings.filter((l) => l.deal === "great" || l.deal === "good").length;

  return (
    <div className="bg-carbon-950 text-zinc-100">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-carbon-800">
        <Stripes />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 md:pt-20 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <div className="min-w-0">
            <div className="eyebrow text-brand-400">ATV · Side-by-side · Snow · Moto</div>
            <h1 className="display mt-5 text-[64px] sm:text-[88px] lg:text-[112px]">
              Buy it right.
              <br />
              Ride it <span className="text-brand-500">hard.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
              Every listing priced against the market. Every model&apos;s weak spots, straight from the people who ride them.
            </p>

            <form action="/listings" className="mt-10 max-w-2xl">
              <fieldset className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Vehicle type">
                {[{ id: "", label: "All" }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.plural }))].map((c) => (
                  <label key={c.id} className="cursor-pointer">
                    <input type="radio" name="category" value={c.id} defaultChecked={c.id === ""} className="peer sr-only" />
                    <span className="block border-b-2 border-transparent pb-1.5 text-sm font-semibold uppercase tracking-wider text-zinc-500 transition peer-checked:border-brand-500 peer-checked:text-white peer-focus-visible:text-white hover:text-zinc-300">
                      {c.label}
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="mt-4 grid gap-px overflow-hidden rounded-sm border border-carbon-700 bg-carbon-700 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
                <input name="q" aria-label="Model or keyword" placeholder="Model or keyword — RZR, Grizzly, T7…" className="bg-carbon-900 px-4 py-3.5 text-sm text-white placeholder:text-zinc-500 focus:bg-carbon-850 focus:outline-none" />
                <select name="make" aria-label="Make" className="bg-carbon-900 px-3 py-3.5 text-sm text-zinc-300 focus:outline-none">
                  <option value="">Any make</option>
                  {MAKES.map((m) => <option key={m}>{m}</option>)}
                </select>
                <select name="near" aria-label="Near" className="bg-carbon-900 px-3 py-3.5 text-sm text-zinc-300 focus:outline-none">
                  <option value="">Anywhere</option>
                  {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}, {c.state}</option>)}
                </select>
                <input type="hidden" name="radius" value="250" />
                <button className="bg-brand-500 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-brand-600">
                  Search
                </button>
              </div>
            </form>
          </div>

          <FeaturedDeal l={featured} />
        </div>
      </section>

      {/* ── Numbers ──────────────────────────────────────── */}
      <section className="border-b border-carbon-800">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 px-4 md:grid-cols-4">
          {[
            [num(listings.length), "Machines for sale"],
            [num(underMarket), "Priced under market"],
            [num(ISSUES.length), "Known issues tracked"],
            [num(PROMOS.length), "Factory offers live"],
          ].map(([n, label], i) => (
            <div key={label} className={`py-7 ${i % 2 ? "pl-6" : ""} ${i > 0 ? "md:border-l md:border-carbon-800 md:pl-8" : ""} ${i === 2 ? "max-md:pl-0" : ""}`}>
              <dt className="eyebrow order-2 mt-1 text-zinc-500">{label}</dt>
              <dd className="font-display text-5xl font-bold italic tabular-nums text-white">{n}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Shop by type ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <SectionHead index="01" title="Shop by machine" />
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-carbon-800 bg-carbon-800 md:grid-cols-4">
          {CATEGORIES.map((c) => {
            const ls = listings.filter((l) => l.model.category === c.id);
            const from = Math.min(...ls.map((l) => l.price));
            return (
              <Link key={c.id} href={`/listings?category=${c.id}`} className="group relative overflow-hidden bg-carbon-900 p-4 transition sm:p-6 hover:bg-carbon-850">
                <span className="display pointer-events-none absolute -bottom-3 -right-2 text-[72px] sm:text-[110px] text-carbon-800 transition group-hover:text-carbon-700">{SHORT[c.id]}</span>
                <div className="relative">
                  <div className="font-display text-2xl font-bold uppercase italic text-white sm:text-3xl">{c.plural}</div>
                  <div className="mt-1 text-sm text-zinc-500">{c.blurb}</div>
                  <div className="mt-10 flex flex-wrap items-baseline gap-x-3 text-sm">
                    <span className="font-semibold text-white">{ls.length} listed</span>
                    <span className="text-zinc-500">from {usd(from)}</span>
                  </div>
                  <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-brand-400 transition group-hover:translate-x-1">Browse →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Deals ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <SectionHead index="02" title="Under market right now" href="/listings?condition=used&deal=great" link="All great deals" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((l) => <DealCard key={l.id} l={l} />)}
        </div>
      </section>

      {/* ── Known issues ─────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-7xl px-4">
        <div className="grid gap-10 rounded-sm border border-carbon-800 bg-carbon-900 p-6 md:p-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="eyebrow text-brand-400">03 — Know before you buy</div>
            <h2 className="display mt-4 text-5xl md:text-6xl">What breaks.<br />What it costs.</h2>
            <p className="mt-5 max-w-sm leading-relaxed text-zinc-400">
              The problems owners keep posting about on Reddit and model forums, plus recalls and service bulletins.
              Symptoms, the usual fix, and the bill.
            </p>
            <Link href="/issues" className="mt-8 inline-block rounded-sm border border-carbon-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:border-white">
              Search all {ISSUES.length} issues
            </Link>
          </div>
          <ol className="divide-y divide-carbon-800 border-y border-carbon-800">
            {issues.map((i, n) => {
              const m = getModel(i.modelSlug)!;
              return (
                <li key={i.id}>
                  <Link href={`/research/${m.slug}#issues`} className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-4">
                    <span className="font-display text-xl font-bold italic tabular-nums text-zinc-600">{String(n + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="eyebrow block text-zinc-500">{m.make} {m.model} · {i.years}</span>
                      <span className="mt-1 block font-semibold text-white group-hover:text-brand-400">{i.title}</span>
                    </span>
                    <span className="text-right text-xs text-zinc-500">
                      <span className={`mb-1 block font-bold uppercase ${i.severity === "major" ? "text-brand-400" : i.severity === "moderate" ? "text-amber-400" : "text-zinc-400"}`}>{i.severity}</span>
                      {i.mentions} threads
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── Offers + reliability ─────────────────────────── */}
      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-20 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <SectionHead index="04" title="Factory offers" href="/deals" link="All offers" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="eyebrow border-b border-carbon-700 text-left text-zinc-500">
                  <th className="pb-3 font-semibold">Brand</th>
                  <th className="pb-3 font-semibold">Program</th>
                  <th className="pb-3 text-right font-semibold">Value</th>
                  <th className="pb-3 text-right font-semibold">Ends</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800">
                {offers.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3.5 pr-4 font-semibold text-white">{p.make}</td>
                    <td className="py-3.5 pr-4">
                      <div className="text-zinc-200">{p.title}</div>
                      <div className="text-xs text-zinc-500">{promoTypeLabel(p.type)}</div>
                    </td>
                    <td className="py-3.5 text-right font-semibold text-emerald-400">{p.amount}</td>
                    <td className={`py-3.5 pl-4 text-right tabular-nums ${daysUntil(p.ends) <= 31 ? "text-brand-400" : "text-zinc-500"}`}>{shortDate(p.ends).replace(/, \d{4}$/, "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-wider">
            {[["Military", "military"], ["First responder", "first-responder"], ["Pro & industry", "pro"], ["Farm & ag", "ag"]].map(([label, t]) => (
              <Link key={t} href={`/deals?type=${t}`} className="text-zinc-400 transition hover:text-white">{label} →</Link>
            ))}
          </div>
        </div>

        <div>
          <SectionHead index="05" title="Most reliable" href="/research?sort=reliability" link="Rankings" />
          <ol className="divide-y divide-carbon-800 border-y border-carbon-800">
            {ranked.map(({ m, s }, n) => (
              <li key={m.slug}>
                <Link href={`/research/${m.slug}`} className="group flex items-center gap-4 py-4">
                  <span className="font-display w-7 text-xl font-bold italic text-zinc-600">{n + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-white group-hover:text-brand-400">{m.make} {m.model}</span>
                    <span className="text-xs text-zinc-500">{m.segment} · {s.count} owner reviews</span>
                  </span>
                  <span className="text-right">
                    <span className="font-display block text-2xl font-bold italic tabular-nums text-white">{s.sub.reliability.toFixed(1)}</span>
                    <span className="eyebrow text-[9px] text-zinc-500">Reliability</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ index, title, href, link }: { index: string; title: string; href?: string; link?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-carbon-800 pb-4">
      <h2 className="flex items-baseline gap-3">
        <span className="font-display text-sm font-bold italic text-brand-500">{index}</span>
        <span className="font-display text-3xl font-bold uppercase italic tracking-tight text-white">{title}</span>
      </h2>
      {href && (
        <Link href={href} className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-zinc-400 transition hover:text-white">
          {link} →
        </Link>
      )}
    </div>
  );
}

function dealLabel(l: Listing) {
  return DEAL_RATINGS.find((d) => d.id === l.deal)!.label;
}

function FeaturedDeal({ l }: { l: Listing }) {
  const pct = Math.round((l.savings / l.marketValue) * 100);
  return (
    <Link href={`/listings/${l.id}`} className="group block rounded-sm border border-carbon-700 bg-carbon-900/80 p-6 backdrop-blur transition hover:border-carbon-600">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-zinc-500">Best deal today</span>
        <span className="rounded-sm bg-emerald-500/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">{dealLabel(l)}</span>
      </div>
      <div className="font-display mt-6 text-4xl font-bold uppercase italic leading-none text-white">
        {l.year} {l.model.make}
        <br />
        {l.model.model}
      </div>
      <div className="mt-2 text-sm text-zinc-500">
        {num(l.usage)} {l.usageUnit} · {l.city.name}, {l.city.state}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-carbon-700">
        <div className="bg-carbon-900 p-4">
          <div className="eyebrow text-zinc-500">Asking</div>
          <div className="font-display mt-1 text-3xl font-bold tabular-nums text-white">{usd(l.price)}</div>
        </div>
        <div className="bg-carbon-900 p-4">
          <div className="eyebrow text-zinc-500">Market value</div>
          <div className="font-display mt-1 text-3xl font-bold tabular-nums text-zinc-500 line-through decoration-1">{usd(l.marketValue)}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-emerald-400">{usd(l.savings)} under · {pct}% below market</span>
        <span className="font-bold uppercase tracking-wider text-zinc-400 transition group-hover:translate-x-1 group-hover:text-white">View →</span>
      </div>
    </Link>
  );
}

function DealCard({ l }: { l: Listing }) {
  return (
    <Link href={`/listings/${l.id}`} className="group flex flex-col rounded-sm border border-carbon-800 bg-carbon-900 p-5 transition hover:border-carbon-600">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-zinc-500">{SHORT[l.model.category]} · {l.city.state}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">{dealLabel(l)}</span>
      </div>
      <div className="mt-4 font-semibold leading-snug text-white group-hover:text-brand-400">
        {l.year} {l.model.make} {l.model.model}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{num(l.usage)} {l.usageUnit} · {l.sellerType === "dealer" ? "Dealer" : "Private"}</div>
      <div className="mt-auto pt-6">
        <div className="font-display text-3xl font-bold tabular-nums text-white">{usd(l.price)}</div>
        <div className="mt-1 text-xs text-zinc-500">
          <span className="font-semibold text-emerald-400">{usd(l.savings)} under</span> est. {usd(l.marketValue)}
        </div>
      </div>
    </Link>
  );
}

/** Diagonal livery stripes echoing the logo. */
function Stripes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(225,18,31,0.12),transparent_55%)]" />
      <svg className="absolute -right-24 top-0 hidden h-full lg:block" viewBox="0 0 400 600" preserveAspectRatio="xMaxYMid slice">
        <path d="M180 0 H260 L80 600 H0 Z" fill="#e1121f" opacity="0.9" />
        <path d="M290 0 H330 L150 600 H110 Z" fill="#ffffff" opacity="0.06" />
      </svg>
    </div>
  );
}
