import Link from "next/link";
import { optionsFor } from "@/lib/fitment/engine";
import { getDraft, getLiveCatalog } from "@/lib/fitment/store";
import { SnowmobileConfigurator } from "@/components/SnowmobileConfigurator";
import { CatalogNav } from "../shared";

export const metadata = { title: "Preview the listing form" };

export default async function PreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const draft = await getDraft();
  const useDraft = !!draft && sp.catalog !== "live";
  const live = await getLiveCatalog();
  const catalog = useDraft ? draft.catalog : live;
  // Optional starting point, e.g. from a model's edit page.
  const initial = optionsFor(catalog, {
    year: sp.year ? Number(sp.year) : undefined,
    manufacturer: sp.manufacturer,
    family: sp.family,
    trim: sp.trim,
    package: sp.package,
  });

  return (
    <div>
      <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">Preview the listing form</h1>
      <p className="mt-1 max-w-3xl text-sm text-zinc-500">
        Pick any configuration to see exactly what a dealer would be offered, then check how it would be saved. Nothing is saved here.
      </p>
      <div className="mt-6"><CatalogNav active="/admin/catalog/preview" /></div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-zinc-500">Using:</span>
        {draft ? (
          <>
            <Link href="?catalog=draft" className={`chip px-3 py-1 ${useDraft ? "border-brand-500 text-white" : ""}`}>Draft</Link>
            <Link href="?catalog=live" className={`chip px-3 py-1 ${!useDraft ? "border-brand-500 text-white" : ""}`}>Live ({live.version})</Link>
          </>
        ) : (
          <span className="chip px-3 py-1">Live {live.version} (no draft yet)</span>
        )}
      </div>
      <SnowmobileConfigurator key={useDraft ? "draft" : "live"} initial={initial} catalog={useDraft ? "draft" : undefined} preview />
    </div>
  );
}
