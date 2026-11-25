import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { promoTypeLabel } from "@/data/promos";
import { getIssues, getPromos } from "@/lib/content";
import { allListings, getListing, timeOnMarket } from "@/lib/listings";
import { bestPromoRate } from "@/lib/finance";
import { CATEGORIES } from "@/data/catalog";
import { PaymentCalculator } from "@/components/PaymentCalculator";
import { compareHref, rivals } from "@/lib/compare";
import { CompareToggle } from "@/components/CompareTray";
import { scoreFor } from "@/lib/reviews";
import { num, cad } from "@/lib/format";
import { DealBadge, DealMeter } from "@/components/DealBadge";
import { VehicleArt } from "@/components/VehicleArt";
import { Stars } from "@/components/Stars";
import { IssueCard } from "@/components/IssueCard";
import { ListingCard } from "@/components/ListingCard";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = getListing((await params).id);
  return { title: l ? `${l.year} ${l.model.make} ${l.model.model} — ${cad(l.price)}` : "Listing" };
}

export default async function ListingPage({ params }: Props) {
  const l = getListing((await params).id);
  if (!l) notFound();
  const m = l.model;
  const issues = await getIssues(m.slug);
  const score = scoreFor(m.slug);
  const promos = (await getPromos(m.make)).filter((p) => p.categories.includes(m.category));
  const similar = allListings()
    .filter((x) => x.modelSlug === m.slug && x.id !== l.id)
    .sort((a, b) => Math.abs(a.year - l.year) - Math.abs(b.year - l.year))
    .slice(0, 3);
  const pct = Math.round((Math.abs(l.savings) / l.marketValue) * 100);
  const tom = timeOnMarket(l);
  const plural = CATEGORIES.find((c) => c.id === m.category)!.plural;
  const peerPlural = plural === "ATVs" ? plural : plural.toLowerCase();
  const promoRate = bestPromoRate(promos, m.make, m.category);
  const original = l.history[0].price;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-zinc-500">
        <Link href="/listings" className="hover:underline">Buy</Link> /{" "}
        <Link href={`/listings?category=${m.category}`} className="hover:underline">{m.category.toUpperCase()}</Link> /{" "}
        <Link href={`/listings?model=${m.slug}`} className="hover:underline">{m.make} {m.model}</Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <VehicleArt category={m.category} color={l.color} className="h-72 md:h-96" />
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold">Overview</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              {[
                ["Condition", l.condition === "new" ? "New" : "Used"],
                [l.usageUnit === "hrs" ? "Hours" : "Kilometres", num(l.usage)],
                ["Engine", m.engine],
                ["Horsepower", m.hp ? `${m.hp} hp` : "—"],
                ["Seats", m.seats ?? (m.category === "motorcycle" ? 2 : 1)],
                ["Colour", l.color],
                ["Title", l.titleStatus],
                ["Owners", l.oneOwner ? "1 owner" : "2+ owners"],
                ["Segment", m.segment],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-zinc-500">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {l.features.length > 0 && (
              <div className="mt-5">
                <div className="text-sm font-semibold">Included extras</div>
                <div className="mt-2 flex flex-wrap gap-1.5">{l.features.map((f) => <span key={f} className="chip">{f}</span>)}</div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Buyer&apos;s checklist for the {m.make} {m.model}</h2>
              <div className="flex flex-wrap items-center gap-4">
                <CompareToggle slug={m.slug} name={`${m.make} ${m.model}`} />
                <Link href={compareHref([m.slug, ...rivals(m).map((r) => r.slug)])} className="text-sm font-semibold text-brand-400 hover:underline">Compare with rivals →</Link>
                <Link href={`/research/${m.slug}#issues`} className="text-sm font-semibold text-brand-400 hover:underline">Full model report →</Link>
              </div>
            </div>
            <p className="mt-1 text-sm text-zinc-500">What to look at, or ask the seller about. Receipts showing the work is done are a good sign.</p>
            <div className="mt-4 space-y-3">
              {issues.map((i) => <IssueCard key={i.id} issue={i} highlightYear={l.year} />)}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="card p-6">
            <h1 className="text-xl font-extrabold leading-tight">{l.year} {m.make} {m.model}</h1>
            <p className="text-sm text-zinc-500">{l.city.name}, {l.city.province} · listed {l.daysOnMarket} days ago</p>
            <div className="mt-4 text-3xl font-extrabold">{cad(l.price)}</div>
            {l.priceDrop > 0 && <div className="text-sm font-semibold text-emerald-400">↓ Dropped {cad(l.priceDrop)}</div>}
            <div className="mt-4"><DealBadge deal={l.deal} size="lg" /></div>
            <p className="mt-3 text-sm text-zinc-400">
              {pct === 0 ? (
                <>This price is <b>right at</b> our estimated market value of </>
              ) : (
                <>This price is <b>{cad(Math.abs(l.savings))} ({pct}%) {l.savings >= 0 ? "below" : "above"}</b> our estimated market value of{" "}</>
              )}
              <b>{cad(l.marketValue)}</b> for a {l.year} with {num(l.usage)} {l.usageUnit}.
            </p>
            <div className="mt-4"><DealMeter price={l.price} market={l.marketValue} /></div>
            <div className="mt-5 grid gap-2">
              <button className="btn-primary">Contact {l.sellerType === "dealer" ? "dealer" : "seller"}</button>
              <button className="btn-ghost">Check availability</button>
            </div>
            <div className="mt-4 border-t border-carbon-800 pt-4 text-sm">
              <div className="font-semibold">{l.seller}</div>
              <div className="text-zinc-500">{l.sellerType === "dealer" ? "Dealer" : "Private party"} · {l.city.name}, {l.city.province}</div>
            </div>
          </div>

          <div className="card p-5 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-bold">Time on market</h2>
              <span className="text-xs text-zinc-500">similar listings: ~{tom.median} days</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold italic tabular-nums text-white">{tom.days}</span>
              <span className="text-zinc-500">days listed</span>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-carbon-800" aria-hidden>
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${tom.level === "long" ? "bg-amber-400" : tom.level === "fresh" ? "bg-brand-500" : "bg-sky-400"}`}
                style={{ width: `${Math.max(4, tom.longerThanPct)}%` }}
              />
            </div>
            <p className="mt-3 text-zinc-400">
              {tom.level === "fresh" && <>Just listed. Well-priced machines can sell quickly, so ask about availability soon.</>}
              {tom.level === "typical" && <>About normal. Similar {peerPlural} are usually listed around {tom.median} days.</>}
              {tom.level === "long" && (
                <>Listed longer than <b className="text-amber-300">{tom.longerThanPct}%</b> of similar listings. The seller may be open to an offer below asking.</>
              )}
            </p>
            {l.history.length > 1 && (
              <div className="mt-4 border-t border-carbon-800 pt-3">
                <div className="font-semibold">Price history</div>
                <ul className="mt-2 space-y-1">
                  {l.history.map((h, i) => (
                    <li key={h.daysAgo} className="flex justify-between">
                      <span className="text-zinc-500">{i === 0 ? `Listed ${h.daysAgo} days ago` : `Dropped ${h.daysAgo} days ago`}</span>
                      <span className="font-semibold">{cad(h.price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold text-emerald-400">
                  {cad(original - l.price)} ({Math.round(((original - l.price) / original) * 100)}%) less than first listed
                </p>
              </div>
            )}
          </div>

          <PaymentCalculator price={l.price} condition={l.condition} sellerType={l.sellerType} province={l.city.province} promo={promoRate} />

          <Link
            href={`/value?model=${m.slug}&year=${l.year}&usage=${l.usage}`}
            className="card block p-5 text-sm transition hover:border-brand-500"
          >
            <div className="font-bold">Trading one in?</div>
            <div className="mt-1 text-zinc-500">See what your machine is worth →</div>
          </Link>

          <Link href={`/research/${m.slug}`} className="card block p-5 transition hover:border-brand-500">
            <div className="text-sm font-bold">Owner rating</div>
            <div className="mt-1 flex items-center gap-2">
              <Stars value={score.avg} />
              <span className="font-bold">{score.avg.toFixed(1)}</span>
              <span className="text-sm text-zinc-500">{score.count} reviews · {score.recommendPct}% recommend</span>
            </div>
          </Link>

          {promos.length > 0 && (
            <div className="card p-5">
              <div className="text-sm font-bold">{m.make} offers that may apply</div>
              <ul className="mt-2 space-y-2 text-sm">
                {promos.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span><span className="font-medium">{p.title}</span> <span className="text-zinc-500">· {promoTypeLabel(p.type)}</span></span>
                    <span className="whitespace-nowrap font-semibold text-emerald-400">{p.amount}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-zinc-500">Factory offers usually apply to new units. Confirm with the dealer.</p>
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-3xl font-bold uppercase italic tracking-tight text-white">Similar {m.make} {m.model} listings</h2>
          <div className="space-y-3">{similar.map((s) => <ListingCard key={s.id} l={s} />)}</div>
        </section>
      )}
    </div>
  );
}
