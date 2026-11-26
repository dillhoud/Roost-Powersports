import Link from "next/link";
import type { Catalog, Rule } from "@/lib/fitment/types";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { Flash } from "../../ui";
import { CatalogNav, DraftBanner, StatusTag, editingCatalog } from "../shared";

export const metadata = { title: "Equipment rules" };

const ORIGIN: Record<string, string> = { factory_standard: "standard", factory_option: "factory option", factory_package: "package", dealer_accessory: "dealer accessory" };

function describeWhen(c: Catalog, r: Rule) {
  const w = r.when;
  const parts: string[] = [];
  if (w.manufacturer) parts.push(w.manufacturer.map((m) => c.manufacturers.find((x) => x.key === m)?.label ?? m).join("/"));
  if (w.family) parts.push(w.family.map((f) => c.trims.find((t) => t.family === f)?.familyLabel ?? f).join("/"));
  if (w.trim) parts.push(w.trim.map((t) => c.trims.find((x) => x.trim === t)?.trimLabel ?? t).join(" / "));
  if (w.package) parts.push(`${w.package.join("/")} pkg`);
  if (w.years) parts.push(w.years.join(", "));
  if (w.yearRange) parts.push(`${w.yearRange[0]}–${w.yearRange[1]}`);
  if (w.market) parts.push(w.market.join("/"));
  return parts.join(" · ") || "Everything";
}

export default async function RulesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { catalog: c, isDraft } = await editingCatalog();
  const label = (f: string, v: string) => c.features.find((x) => x.key === f)?.values.find((x) => x.value === v)?.label ?? v;
  const rows = c.rules
    .filter((r) => (!sp.feature || r.feature === sp.feature) && (!sp.manufacturer || r.when.manufacturer?.includes(sp.manufacturer) || !r.when.manufacturer))
    .sort((a, b) => a.feature.localeCompare(b.feature) || describeWhen(c, a).localeCompare(describeWhen(c, b)));

  return (
    <div>
      <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">Equipment rules</h1>
      <p className="mt-1 max-w-3xl text-sm text-zinc-500">
        Each rule says which equipment values a set of machines can have, and where they come from. A more specific rule&apos;s exclusions beat a broader rule
        (e.g. a display allowed for a whole family but excluded on one trim).
      </p>
      <Flash sp={sp} />
      <div className="mt-6"><CatalogNav active="/admin/catalog/rules" /></div>
      <DraftBanner isDraft={isDraft} />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <AutoSubmitForm className="flex flex-wrap gap-2">
          <select name="feature" defaultValue={sp.feature ?? ""} className="field w-auto" aria-label="Feature">
            <option value="">All equipment</option>
            {c.features.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <select name="manufacturer" defaultValue={sp.manufacturer ?? ""} className="field w-auto" aria-label="Manufacturer">
            <option value="">All makes</option>
            {c.manufacturers.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </AutoSubmitForm>
        <Link href={`/admin/catalog/rules/new${sp.feature ? `?feature=${sp.feature}` : ""}`} className="btn-primary">Add a rule</Link>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <Link key={r.id} href={`/admin/catalog/rules/${encodeURIComponent(r.id)}`} className="card block p-3 text-sm transition hover:border-brand-500">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-white">{c.features.find((f) => f.key === r.feature)?.label ?? r.feature} <span className="font-normal text-zinc-500">· {describeWhen(c, r)}</span></span>
              <span className="flex items-center gap-2 text-xs text-zinc-600">{r.id} <StatusTag status={r.status} /></span>
            </div>
            <div className="mt-1 text-zinc-400">
              {r.allow?.length ? <>Allows {r.allow.map((a) => `${label(r.feature, a.value)} (${ORIGIN[a.origin] ?? a.origin})`).join(", ")}</> : null}
              {r.allow?.length && r.exclude?.length ? " · " : ""}
              {r.exclude?.length ? <span className="text-red-300">Excludes {r.exclude.map((v) => label(r.feature, v)).join(", ")}</span> : null}
            </div>
          </Link>
        ))}
        {!rows.length && <p className="card p-5 text-sm text-zinc-500">No rules match.</p>}
      </div>
    </div>
  );
}
