import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MAKES } from "@/data/catalog";
import { hasDb, prisma } from "@/lib/db";
import { diffLines } from "@/lib/watch";
import { ConfirmButton } from "@/components/ConfirmButton";
import { checkSourceNow, deleteSource, reviewSource, saveSource } from "../../../actions";
import { Field, Flash, SourcePill, ago } from "../../ui";

export const metadata = { title: "Offer page" };

export default async function SourcePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  if (!hasDb) redirect("/admin");
  const { id } = await params;
  const sp = await searchParams;
  const s = await prisma.offerSource.findUnique({ where: { id } });
  if (!s) notFound();
  const { added, removed } = diffLines(s.previousText, s.text);
  const current = (s.text ?? "").split("\n").filter(Boolean);
  const back = `/admin/sources/${s.id}`;

  return (
    <div className="max-w-4xl">
      <Link href="/admin/sources" className="text-sm text-zinc-500 hover:text-white">← Offer pages</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">{s.make}</h1>
        <SourcePill status={s.status} needsReview={s.needsReview} />
      </div>
      <a href={s.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-brand-400 hover:underline">{s.url} ↗</a>
      <p className="mt-1 text-xs text-zinc-500">
        Checked {ago(s.lastCheckedAt)}{s.lastChangedAt && <> · last changed {ago(s.lastChangedAt)}</>}{s.reviewedAt && <> · reviewed {ago(s.reviewedAt)}</>}
      </p>
      <Flash sp={sp} />
      {s.status === "error" && s.error && (
        <p className="mt-4 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{s.error}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {s.needsReview && (
          <form action={reviewSource}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="back" value={back} />
            <button className="btn-primary">Mark reviewed</button>
          </form>
        )}
        <form action={checkSourceNow}>
          <input type="hidden" name="id" value={s.id} />
          <input type="hidden" name="back" value={back} />
          <button className="btn-ghost">Check now</button>
        </form>
        <Link href={`/admin/deals?make=${encodeURIComponent(s.make)}`} className="btn-ghost">{s.make} deals</Link>
        <Link href="/admin/deals/new" className="btn-ghost">Add a deal</Link>
      </div>

      {s.needsReview && (added.length > 0 || removed.length > 0) && (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold text-white">What changed</h2>
          <p className="mt-1 text-sm text-zinc-500">Offer lines that appeared or disappeared since the check before. Open the page to see them in context.</p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {added.map((l) => <li key={`+${l}`} className="rounded-sm bg-emerald-500/10 px-3 py-1.5 text-emerald-300"><b>New:</b> {l}</li>)}
            {removed.map((l) => <li key={`-${l}`} className="rounded-sm bg-red-500/10 px-3 py-1.5 text-red-300 line-through decoration-red-400/50"><b className="no-underline">Gone:</b> {l}</li>)}
          </ul>
        </section>
      )}

      {current.length > 0 && (
        <details className="card mt-6 p-5">
          <summary className="cursor-pointer font-semibold text-white">Offer text found on the page ({current.length} lines)</summary>
          <ul className="mt-3 space-y-1 text-sm text-zinc-400">{current.map((l) => <li key={l}>{l}</li>)}</ul>
        </details>
      )}

      <form action={saveSource} className="card mt-6 space-y-4 p-5">
        <h2 className="font-semibold text-white">Edit</h2>
        <input type="hidden" name="id" value={s.id} />
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Field label="Brand">
            <select name="make" defaultValue={s.make} className="field">
              {MAKES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Offers page link" hint="Changing the link starts fresh: the next check becomes the new starting point.">
            <input name="url" type="url" required defaultValue={s.url} className="field" />
          </Field>
        </div>
        <Field label="Name (optional)">
          <input name="label" defaultValue={s.label} className="field" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={s.active} className="accent-brand-500" /> Check this page every morning
        </label>
        <button className="btn-primary">Save</button>
      </form>

      <form action={deleteSource} className="mt-4">
        <input type="hidden" name="id" value={s.id} />
        <ConfirmButton message={`Stop watching this ${s.make} page?`} className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300">Delete</ConfirmButton>
      </form>
    </div>
  );
}
