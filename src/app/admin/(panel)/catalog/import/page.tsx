import { RULE_CSV_COLUMNS, TRIM_CSV_COLUMNS } from "@/lib/fitment/catalog-tools";
import { importCsv, importJson, saveRawJson } from "../../../catalog-actions";
import { Flash } from "../../ui";
import { CatalogNav, DraftBanner, editingCatalog } from "../shared";

export const metadata = { title: "Import catalog data" };

export default async function ImportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { catalog, isDraft } = await editingCatalog();
  return (
    <div>
      <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">Import &amp; JSON</h1>
      <Flash sp={sp} />
      <div className="mt-6"><CatalogNav active="/admin/catalog/import" /></div>
      <DraftBanner isDraft={isDraft} />

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={importCsv} className="card space-y-3 p-5">
          <h2 className="font-semibold text-white">Import CSV</h2>
          <p className="text-sm text-zinc-500">Adds rows to the draft, or replaces rows with the same id. Lists inside a cell are comma-separated, so wrap them in quotes.</p>
          <select name="kind" className="field" aria-label="What the CSV contains">
            <option value="trims">Models &amp; packages</option>
            <option value="rules">Equipment rules</option>
          </select>
          <input type="file" name="csvFile" accept=".csv,text/csv" className="block text-sm text-zinc-400" />
          <textarea name="csv" rows={6} className="field font-mono text-xs" placeholder="…or paste CSV here" />
          <details className="text-xs text-zinc-500">
            <summary className="cursor-pointer">Columns</summary>
            <p className="mt-2"><b className="text-zinc-300">Models:</b> {TRIM_CSV_COLUMNS.join(", ")}</p>
            <p className="mt-1 font-mono">ski_doo,summit,Summit,summit_neo,Summit Neo,2024-2025,600 EFI,&quot;137:137 in track&quot;,CA,seed-2026-11,seed_unverified</p>
            <p className="mt-2"><b className="text-zinc-300">Rules:</b> {RULE_CSV_COLUMNS.join(", ")}</p>
            <p className="mt-1 font-mono">neo-gauge,gauge_display,,2024-2025,ski_doo,summit,summit_neo,,,&quot;basic_lcd:factory_standard&quot;,large_touchscreen_display,seed-2026-11,seed_unverified,</p>
          </details>
          <button className="btn-primary">Import into draft</button>
        </form>

        <form action={importJson} className="card space-y-3 p-5">
          <h2 className="font-semibold text-white">Import JSON</h2>
          <p className="text-sm text-zinc-500">
            <b className="text-zinc-300">Merge</b> adds or replaces trims, rules and sources by id, and manufacturers, features and aftermarket items by key.{" "}
            <b className="text-zinc-300">Replace</b> swaps the whole draft for a full catalog file.
          </p>
          <select name="mode" className="field" aria-label="Import mode">
            <option value="merge">Merge into draft</option>
            <option value="replace">Replace the whole draft</option>
          </select>
          <input type="file" name="jsonFile" accept=".json,application/json" className="block text-sm text-zinc-400" />
          <textarea name="json" rows={6} className="field font-mono text-xs" placeholder='…or paste JSON, e.g. { "trims": [ … ], "rules": [ … ] }' />
          <button className="btn-primary">Import into draft</button>
        </form>
      </div>

      <form action={saveRawJson} className="card mt-6 space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-white">Edit the {isDraft ? "draft" : "live catalog (saves as a draft)"} as JSON</h2>
          <a href={`/admin/catalog-download?id=${isDraft ? "draft" : "live"}`} className="text-sm font-semibold text-brand-400 hover:underline">Download JSON</a>
        </div>
        <p className="text-sm text-zinc-500">For bulk edits, adding equipment types, values, manufacturers or sources. The problems list on the overview checks it before you can publish.</p>
        <textarea name="json" rows={24} defaultValue={JSON.stringify(catalog, null, 2)} spellCheck={false} className="field font-mono text-xs" />
        <button className="btn-primary">Save draft JSON</button>
      </form>
    </div>
  );
}
