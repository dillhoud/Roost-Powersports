import type { Metadata } from "next";
import Link from "next/link";
import { filterReviews } from "@/lib/reviews";
import { first, withParams } from "@/lib/format";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewFilterPanel, ReviewSort, parseReviewFilters } from "@/components/ReviewFilterPanel";

export const metadata: Metadata = { title: "Owner reviews" };
type SP = Record<string, string | string[] | undefined>;
const PAGE = 15;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const rows = filterReviews(parseReviewFilters(sp));
  const page = Math.max(1, Number(first(sp.page) ?? 1));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Owner reviews</h1>
      <p className="mt-1 text-slate-500">
        Filter by how people actually ride — not just star counts. {rows.length} reviews match · avg {avg.toFixed(1)}★
      </p>
      <AutoSubmitForm className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <ReviewFilterPanel sp={sp} clearHref="/reviews" />
        <section className="min-w-0 space-y-3 transition-opacity [[data-pending]_&]:opacity-50">
          <div className="flex justify-end"><ReviewSort sp={sp} /></div>
          {rows.length === 0 && <div className="card p-10 text-center text-slate-500">No reviews match those filters.</div>}
          {rows.slice((page - 1) * PAGE, page * PAGE).map((r) => <ReviewCard key={r.id} r={r} showModel />)}
          {pages > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-3 text-sm">
              {page > 1 && <Link className="btn-ghost" href={`/reviews${withParams(sp, { page: String(page - 1) })}`}>← Prev</Link>}
              <span className="text-slate-500">Page {page} of {pages}</span>
              {page < pages && <Link className="btn-ghost" href={`/reviews${withParams(sp, { page: String(page + 1) })}`}>Next →</Link>}
            </nav>
          )}
        </section>
      </AutoSubmitForm>
    </div>
  );
}
