import Link from "next/link";
import { redirect } from "next/navigation";
import { MAKES } from "@/data/catalog";
import { hasDb, prisma } from "@/lib/db";
import { addBrandSources, checkAllNow, checkSourceNow, reviewSource, saveSource } from "../../actions";
import { Field, Flash, SourcePill, ago } from "../ui";

export const metadata = { title: "Offer pages" };

export default async function AdminSources({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!hasDb) redirect("/admin");
  const sp = await searchParams;
  const rows = await prisma.offerSource.findMany({ orderBy: [{ needsReview: "desc" }, { make: "asc" }] });
  const changed = rows.filter((r) => r.needsReview).length;
  const errors = rows.filter((r) => r.status === "error" && !r.needsReview).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">Offer pages</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Brand websites checked every morning. When an offers page changes it&apos;s flagged here, so you can update your deals and mark it reviewed.
          </p>
        </div>
        {rows.length > 0 && (
          <form action={checkAllNow}>
            <button className="btn-ghost">Check all now</button>
          </form>
        )}
      </div>
      <Flash sp={sp} />

      {rows.length > 0 && (
        <p className="mt-6 text-sm text-zinc-400">
          {changed ? <b className="text-amber-300">{changed} changed and waiting for review. </b> : "No changes waiting. "}
          {errors > 0 && <span className="text-red-300">{errors} can&apos;t be checked automatically. </span>}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className={`card flex flex-wrap items-center gap-x-5 gap-y-3 p-4 ${r.needsReview ? "border-amber-500/40" : ""}`}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <SourcePill status={r.status} needsReview={r.needsReview} />
                <span className="font-semibold text-white">{r.make}</span>
                {!r.active && <span className="chip">Paused</span>}
                {r.label && <span className="text-sm text-zinc-500">{r.label}</span>}
              </div>
              <a href={r.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm text-brand-400 hover:underline">{r.url}</a>
              <p className="mt-1 text-xs text-zinc-500">
                Checked {ago(r.lastCheckedAt)}
                {r.lastChangedAt && <> · last changed {ago(r.lastChangedAt)}</>}
                {r.status === "error" && r.error && <span className="text-red-300"> · {r.error}</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.needsReview && (
                <Link href={`/admin/sources/${r.id}`} className="btn-primary">See what changed</Link>
              )}
              {r.needsReview && (
                <form action={reviewSource}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="back" value="/admin/sources" />
                  <button className="btn-ghost">Mark reviewed</button>
                </form>
              )}
              <form action={checkSourceNow}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="back" value="/admin/sources" />
                <button className="btn-ghost">Check now</button>
              </form>
              <Link href={`/admin/sources/${r.id}`} className="btn-ghost">Edit</Link>
            </div>
          </div>
        ))}
      </div>

      <form action={saveSource} className="card mt-8 grid gap-4 p-5 md:grid-cols-[180px_1fr_1fr_auto] md:items-end">
        <div className="md:col-span-4">
          <h2 className="font-semibold text-white">Add an offers page</h2>
          <p className="mt-1 text-sm text-zinc-500">Paste the link to the brand&apos;s Canadian offers or promotions page. It&apos;s checked straight away, then every morning.</p>
        </div>
        <Field label="Brand">
          <select name="make" className="field" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {MAKES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Offers page link">
          <input name="url" type="url" required placeholder="https://www.example.ca/offers" className="field" />
        </Field>
        <Field label="Name (optional)">
          <input name="label" placeholder="e.g. Side-by-side offers" className="field" />
        </Field>
        <button className="btn-primary h-[38px]">Add page</button>
      </form>

      {rows.length === 0 && (
        <form action={addBrandSources} className="card mt-4 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm text-zinc-400">Not sure where to start? Add each brand&apos;s Canadian website, then edit each one to point at its offers page.</p>
          <button className="btn-ghost">Add brand websites</button>
        </form>
      )}
    </div>
  );
}
