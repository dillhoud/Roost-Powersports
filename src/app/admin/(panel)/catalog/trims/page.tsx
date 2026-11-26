import Link from "next/link";
import { Flash } from "../../ui";
import { CatalogNav, DraftBanner, StatusTag, editingCatalog } from "../shared";

export const metadata = { title: "Catalog models" };

export default async function TrimsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { catalog, isDraft } = await editingCatalog();
  const make = (k: string) => catalog.manufacturers.find((m) => m.key === k)?.label ?? k;
  const groups = new Map<string, typeof catalog.trims>();
  for (const t of [...catalog.trims].sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.family.localeCompare(b.family) || a.trimLabel.localeCompare(b.trimLabel))) {
    const k = `${make(t.manufacturer)} ${t.familyLabel}`;
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }
  return (
    <div>
      <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">Models &amp; packages</h1>
      <Flash sp={sp} />
      <div className="mt-6"><CatalogNav active="/admin/catalog/trims" /></div>
      <DraftBanner isDraft={isDraft} />
      <div className="mb-4 flex justify-end"><Link href="/admin/catalog/trims/new" className="btn-primary">Add a model</Link></div>
      <div className="space-y-4">
        {[...groups].map(([g, trims]) => (
          <section key={g} className="card p-4">
            <h2 className="font-semibold text-white">{g}</h2>
            <ul className="mt-2 divide-y divide-carbon-800 text-sm">
              {trims.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`/admin/catalog/trims/${encodeURIComponent(t.id)}`} className="font-medium text-zinc-200 hover:text-brand-400">{t.trimLabel}</Link>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {t.years.join(", ")} · {t.packages.map((p) => p.key).join("/")} · {t.market.join(", ")} <StatusTag status={t.status} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
