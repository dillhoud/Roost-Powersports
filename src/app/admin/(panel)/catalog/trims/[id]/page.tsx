import Link from "next/link";
import { notFound } from "next/navigation";
import { CONFIDENCES } from "@/lib/fitment/catalog-tools";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteTrim, saveTrim } from "../../../../catalog-actions";
import { Field, Flash } from "../../../ui";
import { DraftBanner, editingCatalog } from "../../shared";

export const metadata = { title: "Catalog model" };

export default async function TrimEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ id: raw }, sp] = await Promise.all([params, searchParams]);
  const id = decodeURIComponent(raw);
  const { catalog, isDraft } = await editingCatalog();
  const t = id === "new" ? undefined : catalog.trims.find((x) => x.id === id);
  if (id !== "new" && !t) notFound();
  const rulesUsing = t ? catalog.rules.filter((r) => r.when.trim?.includes(t.trim)) : [];

  return (
    <div className="max-w-3xl">
      <Link href="/admin/catalog/trims" className="text-sm text-zinc-500 hover:text-white">← Models &amp; packages</Link>
      <h1 className="mt-3 font-display text-3xl font-bold uppercase italic tracking-tight text-white">{t ? t.trimLabel : "Add a model"}</h1>
      <Flash sp={sp} />
      <div className="mt-4"><DraftBanner isDraft={isDraft} /></div>
      <form action={saveTrim} className="card space-y-4 p-5">
        <input type="hidden" name="originalId" value={t?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Manufacturer">
            <select name="manufacturer" defaultValue={t?.manufacturer ?? ""} className="field" required>
              <option value="" disabled>Choose…</option>
              {catalog.manufacturers.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Record id" hint="Leave blank to generate one."><input name="id" defaultValue={t?.id} className="field" /></Field>
          <Field label="Family key" hint="e.g. summit"><input name="family" defaultValue={t?.family} required className="field" /></Field>
          <Field label="Family name" hint="e.g. Summit"><input name="familyLabel" defaultValue={t?.familyLabel} className="field" /></Field>
          <Field label="Model / trim key" hint="e.g. summit_x_850"><input name="trim" defaultValue={t?.trim} required className="field" /></Field>
          <Field label="Model / trim name" hint="As the manufacturer names it"><input name="trimLabel" defaultValue={t?.trimLabel} className="field" /></Field>
          <Field label="Model years" hint="e.g. 2023, 2024 or 2021-2024"><input name="years" defaultValue={t?.years.join(", ")} required className="field" /></Field>
          <Field label="Engine"><input name="engine" defaultValue={t?.engine} className="field" /></Field>
        </div>
        <Field label="Packages" hint='Comma-separated, key:label. e.g. "154:154 in track, 165:165 in track"'>
          <input name="packages" defaultValue={t?.packages.map((p) => `${p.key}:${p.label}`).join(", ")} required className="field" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Markets" hint="e.g. CA, US"><input name="market" defaultValue={t?.market.join(", ") ?? "CA"} className="field" /></Field>
          <Field label="Source">
            <select name="source" defaultValue={t?.source} className="field">
              {catalog.sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Confidence">
            <select name="status" defaultValue={t?.status ?? "unknown"} className="field">
              {CONFIDENCES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
        </div>
        <button className="btn-primary">Save to draft</button>
      </form>
      {t && (
        <>
          <p className="mt-4 text-sm text-zinc-500">
            {rulesUsing.length ? `${rulesUsing.length} rule${rulesUsing.length > 1 ? "s" : ""} name this trim directly. ` : "No rules name this trim directly; family and manufacturer rules still apply. "}
            <Link href={`/admin/catalog/preview?year=${t.years[t.years.length - 1]}&manufacturer=${t.manufacturer}&family=${t.family}&trim=${t.trim}`} className="text-brand-400 hover:underline">Preview the form for this model →</Link>
          </p>
          <form action={deleteTrim} className="mt-4">
            <input type="hidden" name="id" value={t.id} />
            <ConfirmButton message={`Remove ${t.trimLabel} from the draft?`} className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300">Delete model</ConfirmButton>
          </form>
        </>
      )}
    </div>
  );
}
