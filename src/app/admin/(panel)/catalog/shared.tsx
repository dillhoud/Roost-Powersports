import Link from "next/link";
import { getDraft, getLiveCatalog } from "@/lib/fitment/store";

/** The catalog an editor page shows: the draft if there is one, otherwise the live catalog (read-only until something is saved). */
export async function editingCatalog() {
  const draft = await getDraft();
  return draft ? { catalog: draft.catalog, isDraft: true } : { catalog: await getLiveCatalog(), isDraft: false };
}

export function CatalogNav({ active }: { active: string }) {
  const tabs = [
    ["/admin/catalog", "Overview"],
    ["/admin/catalog/trims", "Models & packages"],
    ["/admin/catalog/rules", "Equipment rules"],
    ["/admin/catalog/import", "Import & JSON"],
    ["/admin/catalog/preview", "Preview form"],
  ];
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {tabs.map(([href, label]) => (
        <Link key={href} href={href} className={`rounded-sm border px-3 py-1.5 text-sm ${active === href ? "border-brand-500 bg-brand-500/10 text-white" : "border-carbon-700 text-zinc-400 hover:text-white"}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function DraftBanner({ isDraft }: { isDraft: boolean }) {
  return isDraft ? (
    <p className="mb-4 rounded-sm border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
      Editing the <b>draft</b>. Nothing changes for dealers until you publish it on the <Link href="/admin/catalog" className="underline">overview</Link>.
    </p>
  ) : (
    <p className="mb-4 rounded-sm border border-carbon-700 bg-carbon-900 px-4 py-2 text-sm text-zinc-400">
      Showing the <b className="text-zinc-200">live</b> catalog. Saving any change starts a private draft.
    </p>
  );
}

export const StatusTag = ({ status }: { status: string }) => (
  <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.startsWith("verified") || status === "admin_verified" ? "bg-emerald-500/15 text-emerald-300" : "bg-carbon-700 text-zinc-400"}`}>
    {status.replace(/_/g, " ")}
  </span>
);
