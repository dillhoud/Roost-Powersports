import Link from "next/link";
import { hasDb, prisma } from "@/lib/db";
import { affectedListings, checkCatalog } from "@/lib/fitment/catalog-tools";
import { getDraft, getLiveCatalog, listVersions, seedVersion } from "@/lib/fitment/store";
import { shortDate } from "@/lib/format";
import { ConfirmButton } from "@/components/ConfirmButton";
import { discardDraftAction, publishDraftAction, rollbackAction, startDraft } from "../../catalog-actions";
import { Flash } from "../ui";
import { CatalogNav } from "./shared";

export const metadata = { title: "Catalog" };

export default async function CatalogOverview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!hasDb) {
    return (
      <div>
        <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">Snowmobile catalog</h1>
        <p className="mt-3 text-zinc-400">Connect a database to edit the catalog. Until then the built-in seed catalog ({seedVersion}) is used.</p>
      </div>
    );
  }
  const [live, draft, versions, listings, usage] = await Promise.all([
    getLiveCatalog(),
    getDraft(),
    listVersions(),
    prisma.snowmobileListing.findMany({ select: { id: true, title: true, year: true, manufacturer: true, family: true, trim: true, package: true, equipment: true } }),
    prisma.snowmobileListing.groupBy({ by: ["catalogVersion"], _count: true }),
  ]);
  const used = new Map(usage.map((u) => [u.catalogVersion, u._count]));
  const problems = draft ? checkCatalog({ ...draft.catalog, version: "check" }) : [];
  const impact = draft ? affectedListings(live, draft.catalog, listings as unknown as Parameters<typeof affectedListings>[2]) : [];
  const verifiedShare = (c: typeof live) => {
    const all = [...c.trims, ...c.rules];
    const v = all.filter((x) => x.status.startsWith("verified") || x.status === "admin_verified").length;
    return `${v} of ${all.length}`;
  };

  return (
    <div>
      <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">Snowmobile catalog</h1>
      <p className="mt-1 max-w-3xl text-sm text-zinc-500">
        The models, packages and equipment rules behind the listing form. Edit a private draft, preview the form with it, then publish.
        Saved listings keep the version they were checked against.
      </p>
      <Flash sp={sp} />
      <div className="mt-6"><CatalogNav active="/admin/catalog" /></div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 text-sm">
          <div className="eyebrow text-zinc-500">Live</div>
          <div className="mt-1 font-display text-2xl font-bold italic text-white">{live.version}</div>
          <p className="mt-1 text-zinc-400">{live.trims.length} models · {live.rules.length} rules · {verifiedShare(live)} records verified</p>
          {live.version === seedVersion && <p className="mt-3 text-amber-300">This is the built-in seed data, which hasn&apos;t been verified. Replace it with checked manufacturer data before dealers rely on it.</p>}
        </section>

        <section className="card p-5 text-sm">
          <div className="eyebrow text-zinc-500">Draft</div>
          {draft ? (
            <>
              <p className="mt-1 text-zinc-300">{draft.catalog.trims.length} models · {draft.catalog.rules.length} rules · last edited {shortDate(draft.updatedAt.toISOString().slice(0, 10))}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/admin/catalog/preview" className="btn-ghost">Preview form</Link>
                <form action={discardDraftAction}><ConfirmButton message="Throw away every change in the draft?" className="btn-ghost">Discard draft</ConfirmButton></form>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-zinc-400">No draft. Editing any model or rule starts one automatically.</p>
              <form action={startDraft} className="mt-3"><button className="btn-ghost">Start a draft</button></form>
            </>
          )}
        </section>
      </div>

      {draft && (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold text-white">Before publishing</h2>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-zinc-300">Problems ({problems.length})</div>
              {problems.length ? (
                <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-sm text-red-300">{problems.map((p) => <li key={p}>• {p}</li>)}</ul>
              ) : (
                <p className="mt-2 text-sm text-emerald-300">No problems found.</p>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-300">Listings affected ({impact.length} of {listings.length})</div>
              <p className="mt-1 text-xs text-zinc-500">Saved listings keep their equipment. These would show different choices if re-listed, so check them.</p>
              {impact.length ? (
                <ul className="mt-2 max-h-64 space-y-2 overflow-auto text-sm">
                  {impact.map((i) => (
                    <li key={i.id}>
                      <Link href={`/admin/listings/${i.id}`} className="font-semibold text-brand-400 hover:underline">{i.title}</Link>
                      <ul className="text-xs text-zinc-400">{i.reasons.map((r) => <li key={r}>– {r}</li>)}</ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">None.</p>
              )}
            </div>
          </div>
          <form action={publishDraftAction} className="mt-5 flex flex-wrap items-end gap-3">
            <label className="block min-w-64 flex-1">
              <span className="label">What changed (for the history)</span>
              <input name="note" className="field" placeholder="e.g. Verified 2024 Summit gauges against Ski-Doo CA catalog" />
            </label>
            <button disabled={problems.length > 0} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">Publish draft</button>
          </form>
        </section>
      )}

      <section className="card mt-6 overflow-x-auto p-5">
        <h2 className="font-semibold text-white">Version history</h2>
        <table className="mt-3 w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr><th className="py-2">Version</th><th>Published</th><th>Note</th><th>Listings</th><th /></tr>
          </thead>
          <tbody>
            {[...versions.map((v) => ({ ...v, seed: false })), { id: "seed", version: seedVersion, note: "Built-in seed data", publishedAt: null, seed: true }].map((v) => (
              <tr key={v.id} className="border-t border-carbon-800">
                <td className="py-2 font-semibold text-white">{v.version}{v.version === live.version && <span className="ml-2 rounded-sm bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">Live</span>}</td>
                <td className="text-zinc-400">{v.publishedAt ? shortDate(v.publishedAt.toISOString().slice(0, 10)) : "—"}</td>
                <td className="text-zinc-400">{v.note || "—"}</td>
                <td className="text-zinc-400">{used.get(v.version) ?? 0}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-3">
                    <a href={`/admin/catalog-download?id=${v.id}`} className="text-xs font-semibold text-zinc-400 hover:text-white">JSON</a>
                    {v.version !== live.version && (
                      <form action={rollbackAction}>
                        <input type="hidden" name="id" value={v.id} />
                        <ConfirmButton message={`Make ${v.version} live again?`} className="text-xs font-semibold text-brand-400 hover:underline">Roll back to this</ConfirmButton>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
