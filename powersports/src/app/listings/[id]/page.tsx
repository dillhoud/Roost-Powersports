import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { issuesFor } from "@/data/issues";
import { promosForMake, promoTypeLabel } from "@/data/promos";
import { allListings, getListing } from "@/lib/listings";
import { scoreFor } from "@/lib/reviews";
import { num, usd } from "@/lib/format";
import { DealBadge, DealMeter } from "@/components/DealBadge";
import { VehicleArt } from "@/components/VehicleArt";
import { Stars } from "@/components/Stars";
import { IssueCard } from "@/components/IssueCard";
import { ListingCard } from "@/components/ListingCard";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = getListing((await params).id);
  return { title: l ? `${l.year} ${l.model.make} ${l.model.model} — ${usd(l.price)}` : "Listing" };
}

export default async function ListingPage({ params }: Props) {
  const l = getListing((await params).id);
  if (!l) notFound();
  const m = l.model;
  const issues = issuesFor(m.slug);
  const score = scoreFor(m.slug);
  const promos = promosForMake(m.make).filter((p) => p.categories.includes(m.category));
  const similar = allListings()
    .filter((x) => x.modelSlug === m.slug && x.id !== l.id)
    .sort((a, b) => Math.abs(a.year - l.year) - Math.abs(b.year - l.year))
    .slice(0, 3);
  const pct = Math.round((Math.abs(l.savings) / l.marketValue) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate-500">
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
                [l.usageUnit === "hrs" ? "Hours" : "Miles", num(l.usage)],
                ["Engine", m.engine],
                ["Horsepower", m.hp ? `${m.hp} hp` : "—"],
                ["Seats", m.seats ?? (m.category === "motorcycle" ? 2 : 1)],
                ["Color", l.color],
                ["Title", l.titleStatus],
                ["Owners", l.oneOwner ? "1 owner" : "2+ owners"],
                ["Segment", m.segment],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-slate-500">{k}</dt>
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
              <h2 className="text-lg font-bold">Known issues for the {m.make} {m.model}</h2>
              <Link href={`/research/${m.slug}#issues`} className="text-sm font-semibold text-brand-600 hover:underline">Full model report →</Link>
            </div>
            <p className="mt-1 text-sm text-slate-500">What owners report most — ask the seller about these before you buy.</p>
            <div className="mt-4 space-y-3">
              {issues.map((i) => <IssueCard key={i.id} issue={i} highlightYear={l.year} />)}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="card p-6">
            <h1 className="text-xl font-extrabold leading-tight">{l.year} {m.make} {m.model}</h1>
            <p className="text-sm text-slate-500">{l.city.name}, {l.city.state} · listed {l.daysOnMarket} days ago</p>
            <div className="mt-4 text-3xl font-extrabold">{usd(l.price)}</div>
            {l.priceDrop > 0 && <div className="text-sm font-semibold text-emerald-700">Dropped {usd(l.priceDrop)}</div>}
            <div className="mt-4"><DealBadge deal={l.deal} size="lg" /></div>
            <p className="mt-3 text-sm text-slate-600">
              {pct === 0 ? (
                <>This price is <b>right at</b> our estimated market value of </>
              ) : (
                <>This price is <b>{usd(Math.abs(l.savings))} ({pct}%) {l.savings >= 0 ? "below" : "above"}</b> our estimated market value of{" "}</>
              )}
              <b>{usd(l.marketValue)}</b> for a {l.year} with {num(l.usage)} {l.usageUnit}.
            </p>
            <div className="mt-4"><DealMeter price={l.price} market={l.marketValue} /></div>
            <div className="mt-5 grid gap-2">
              <button className="btn-primary">Contact {l.sellerType === "dealer" ? "dealer" : "seller"}</button>
              <button className="btn-ghost">Check availability</button>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
              <div className="font-semibold">{l.seller}</div>
              <div className="text-slate-500">{l.sellerType === "dealer" ? "Dealer" : "Private party"} · {l.city.name}, {l.city.state}</div>
            </div>
          </div>

          {l.history.length > 1 && (
            <div className="card p-5 text-sm">
              <div className="font-bold">Price history</div>
              <ul className="mt-2 space-y-1">
                {l.history.map((h) => (
                  <li key={h.daysAgo} className="flex justify-between"><span className="text-slate-500">{h.daysAgo} days ago</span><span className="font-semibold">{usd(h.price)}</span></li>
                ))}
              </ul>
            </div>
          )}

          <Link href={`/research/${m.slug}`} className="card block p-5 transition hover:border-brand-500">
            <div className="text-sm font-bold">Owner rating</div>
            <div className="mt-1 flex items-center gap-2">
              <Stars value={score.avg} />
              <span className="font-bold">{score.avg.toFixed(1)}</span>
              <span className="text-sm text-slate-500">{score.count} reviews · {score.recommendPct}% recommend</span>
            </div>
          </Link>

          {promos.length > 0 && (
            <div className="card p-5">
              <div className="text-sm font-bold">{m.make} offers that may apply</div>
              <ul className="mt-2 space-y-2 text-sm">
                {promos.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span><span className="font-medium">{p.title}</span> <span className="text-slate-500">· {promoTypeLabel(p.type)}</span></span>
                    <span className="whitespace-nowrap font-semibold text-emerald-700">{p.amount}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">Factory offers usually apply to new units. Confirm with the dealer.</p>
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-extrabold tracking-tight">Similar {m.make} {m.model} listings</h2>
          <div className="space-y-3">{similar.map((s) => <ListingCard key={s.id} l={s} />)}</div>
        </section>
      )}
    </div>
  );
}
