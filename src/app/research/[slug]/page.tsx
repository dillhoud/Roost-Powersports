import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOG, categoryLabel, getModel } from "@/data/catalog";
import { issuesFor } from "@/data/issues";
import { promosForMake, promoTypeLabel } from "@/data/promos";
import { marketStats } from "@/lib/listings";
import { filterReviews, scoreFor, SUB_LABELS, SUB_RATINGS } from "@/lib/reviews";
import { first, usd, withParams } from "@/lib/format";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { IssueCard } from "@/components/IssueCard";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewFilterPanel, ReviewSort, parseReviewFilters } from "@/components/ReviewFilterPanel";
import { RatingBar, Stars } from "@/components/Stars";
import { VehicleArt } from "@/components/VehicleArt";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateStaticParams() {
  return CATALOG.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = getModel((await params).slug);
  return { title: m ? `${m.make} ${m.model} reviews, problems & prices` : "Model" };
}

const PAGE = 8;

export default async function ModelPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const m = getModel(slug);
  if (!m) notFound();
  const s = scoreFor(slug);
  const issues = issuesFor(slug);
  const market = marketStats(slug);
  const promos = promosForMake(m.make).filter((p) => p.categories.includes(m.category));
  const reviews = filterReviews({ ...parseReviewFilters(sp), model: slug, category: undefined, make: [] });
  const page = Math.max(1, Number(first(sp.page) ?? 1));
  const pages = Math.max(1, Math.ceil(reviews.length / PAGE));
  const base = `/research/${slug}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/research" className="hover:underline">Research</Link> /{" "}
        <Link href={`/research?category=${m.category}`} className="hover:underline">{categoryLabel(m.category)}</Link> / {m.make}
      </nav>

      {/* Header */}
      <section className="card grid overflow-hidden md:grid-cols-[1fr_1.3fr]">
        <VehicleArt category={m.category} className="h-60 md:h-full" />
        <div className="p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{m.segment} · {m.years[0]}–{m.years[1]}</div>
          <h1 className="text-3xl font-extrabold tracking-tight">{m.make} {m.model}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Stars value={s.avg} className="text-xl" />
            <span className="text-xl font-bold">{s.avg.toFixed(1)}</span>
            <span className="text-slate-500">{s.count} owner reviews · {s.recommendPct}% would recommend</span>
          </div>
          <p className="mt-3 text-slate-700">{m.summary}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ul className="space-y-1 text-sm">{m.pros.map((p) => <li key={p}><span className="font-bold text-emerald-600">+</span> {p}</li>)}</ul>
            <ul className="space-y-1 text-sm">{m.cons.map((p) => <li key={p}><span className="font-bold text-red-600">−</span> {p}</li>)}</ul>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/listings?model=${slug}`} className="btn-primary">See {market.count} for sale</Link>
            <a href="#issues" className="btn-ghost">Known issues ({issues.length})</a>
            <a href="#reviews" className="btn-ghost">Reviews</a>
          </div>
        </div>
      </section>

      {/* Quick facts */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="font-bold">Owner ratings</h2>
          <div className="mt-3 space-y-2">{SUB_RATINGS.map((k) => <RatingBar key={k} label={SUB_LABELS[k]} value={s.sub[k]} />)}</div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Prices</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">New (base MSRP)</dt><dd className="font-semibold">{usd(m.msrp)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Used average asking</dt><dd className="font-semibold">{market.usedCount ? usd(market.avg) : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Used price range</dt><dd className="font-semibold">{market.usedCount ? `${usd(market.low)} – ${usd(market.high)}` : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Good or great deals now</dt><dd className="font-semibold">{market.greatDeals}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Engine</dt><dd className="font-semibold">{m.engine}{m.hp ? ` · ${m.hp} hp` : ""}</dd></div>
          </dl>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Current {m.make} offers</h2>
          {promos.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {promos.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span>{p.title} <span className="text-slate-500">· {promoTypeLabel(p.type)}</span></span>
                  <span className="whitespace-nowrap font-semibold text-emerald-700">{p.amount}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-slate-500">No current offers found.</p>}
          <Link href={`/deals?make=${encodeURIComponent(m.make)}`} className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">All {m.make} deals →</Link>
        </div>
      </section>

      {/* Issues */}
      <section id="issues" className="mt-10 scroll-mt-20">
        <h2 className="text-2xl font-extrabold tracking-tight">Common problems owners report</h2>
        <p className="mt-1 text-sm text-slate-500">
          Compiled from recurring discussions in rider communities and public recall notices. Always run the VIN through the manufacturer&apos;s recall lookup.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {issues.map((i) => <IssueCard key={i.id} issue={i} />)}
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mt-10 scroll-mt-20">
        <h2 className="text-2xl font-extrabold tracking-tight">Owner reviews</h2>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {[5, 4, 3, 2, 1].map((star) => (
            <Link key={star} scroll={false} href={`${base}${withParams({}, { minRating: String(star) })}#reviews`} className="flex items-center gap-1.5 hover:text-brand-600">
              {star}★ <span className="inline-block h-1.5 w-16 rounded bg-slate-100"><span className="block h-1.5 rounded bg-amber-400" style={{ width: `${(s.dist[star - 1] / Math.max(1, s.count)) * 100}%` }} /></span> {s.dist[star - 1]}
            </Link>
          ))}
        </div>
        <AutoSubmitForm className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
          <ReviewFilterPanel sp={sp} clearHref={`${base}#reviews`} fixedModel />
          <div className="min-w-0 space-y-3 transition-opacity [[data-pending]_&]:opacity-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{reviews.length} reviews match</span>
              <ReviewSort sp={sp} />
            </div>
            {reviews.length === 0 && <div className="card p-10 text-center text-slate-500">No reviews match those filters.</div>}
            {reviews.slice((page - 1) * PAGE, page * PAGE).map((r) => <ReviewCard key={r.id} r={r} />)}
            {pages > 1 && (
              <nav className="flex items-center justify-center gap-2 pt-3 text-sm">
                {page > 1 && <Link scroll={false} className="btn-ghost" href={`${base}${withParams(sp, { page: String(page - 1) })}`}>← Prev</Link>}
                <span className="text-slate-500">Page {page} of {pages}</span>
                {page < pages && <Link scroll={false} className="btn-ghost" href={`${base}${withParams(sp, { page: String(page + 1) })}`}>Next →</Link>}
              </nav>
            )}
          </div>
        </AutoSubmitForm>
      </section>
    </div>
  );
}
