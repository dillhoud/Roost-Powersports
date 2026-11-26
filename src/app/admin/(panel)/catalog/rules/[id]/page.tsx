import Link from "next/link";
import { notFound } from "next/navigation";
import { CONFIDENCES, RULE_ORIGINS } from "@/lib/fitment/catalog-tools";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteRule, saveRule } from "../../../../catalog-actions";
import { Field, Flash } from "../../../ui";
import { DraftBanner, editingCatalog } from "../../shared";

export const metadata = { title: "Equipment rule" };

export default async function RuleEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ id: raw }, sp] = await Promise.all([params, searchParams]);
  const id = decodeURIComponent(raw);
  const { catalog: c, isDraft } = await editingCatalog();
  const r = id === "new" ? undefined : c.rules.find((x) => x.id === id);
  if (id !== "new" && !r) notFound();
  const w = r?.when ?? {};
  const feature = r?.feature ?? sp.feature ?? c.features[0]?.key;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/catalog/rules" className="text-sm text-zinc-500 hover:text-white">← Equipment rules</Link>
      <h1 className="mt-3 font-display text-3xl font-bold uppercase italic tracking-tight text-white">{r ? `Rule ${r.id}` : "Add a rule"}</h1>
      <Flash sp={sp} />
      <div className="mt-4"><DraftBanner isDraft={isDraft} /></div>
      <form action={saveRule} className="card space-y-5 p-5">
        <input type="hidden" name="originalId" value={r?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rule id"><input name="id" defaultValue={r?.id} required className="field" placeholder="e.g. sd-summit-24-gauge" /></Field>
          <Field label="Equipment">
            <select name="feature" defaultValue={feature} className="field">
              {c.features.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </Field>
        </div>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-white">Applies to</legend>
          <p className="text-xs text-zinc-500">Leave a box empty to match anything. Separate several values with commas. Keys are listed below.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Manufacturers"><input name="manufacturer" defaultValue={w.manufacturer?.join(", ")} className="field" placeholder="ski_doo" /></Field>
            <Field label="Families"><input name="family" defaultValue={w.family?.join(", ")} className="field" placeholder="summit" /></Field>
            <Field label="Trims"><input name="trim" defaultValue={w.trim?.join(", ")} className="field" placeholder="summit_x_850" /></Field>
            <Field label="Packages"><input name="package" defaultValue={w.package?.join(", ")} className="field" placeholder="154, 165" /></Field>
            <Field label="Exact years" hint="e.g. 2023, 2025"><input name="years" defaultValue={w.years?.join(", ")} className="field" /></Field>
            <Field label="Year range" hint="e.g. 2021-2024"><input name="year_range" defaultValue={w.yearRange ? `${w.yearRange[0]}-${w.yearRange[1]}` : ""} className="field" /></Field>
            <Field label="Markets"><input name="market" defaultValue={w.market?.join(", ")} className="field" placeholder="CA" /></Field>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-white">Values</legend>
          <Field label="Allows" hint={`value:origin, comma-separated. Origins: ${RULE_ORIGINS.join(", ")}`}>
            <input name="allow" defaultValue={r?.allow?.map((a) => `${a.value}:${a.origin}`).join(", ")} className="field" placeholder="basic_lcd:factory_standard, large_color_display:factory_option" />
          </Field>
          <Field label="Excludes" hint="Values to remove, even if a broader rule allows them.">
            <input name="exclude" defaultValue={r?.exclude?.join(", ")} className="field" placeholder="large_touchscreen_display" />
          </Field>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Source">
            <select name="source" defaultValue={r?.source} className="field">
              {c.sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Confidence">
            <select name="status" defaultValue={r?.status ?? "unknown"} className="field">
              {CONFIDENCES.map((x) => <option key={x} value={x}>{x.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Note (optional)"><input name="note" defaultValue={r?.note} className="field" /></Field>
        <button className="btn-primary">Save to draft</button>
      </form>

      <details className="card mt-4 p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-white">Keys you can use</summary>
        <div className="mt-3 space-y-3 text-zinc-400">
          <p><b className="text-zinc-200">Manufacturers:</b> {c.manufacturers.map((m) => m.key).join(", ")}</p>
          <p><b className="text-zinc-200">Families:</b> {[...new Set(c.trims.map((t) => t.family))].join(", ")}</p>
          <p><b className="text-zinc-200">Trims:</b> {c.trims.map((t) => t.trim).join(", ")}</p>
          {c.features.map((f) => <p key={f.key}><b className="text-zinc-200">{f.label} values:</b> {f.values.map((v) => v.value).join(", ")}</p>)}
        </div>
      </details>

      {r && (
        <form action={deleteRule} className="mt-4">
          <input type="hidden" name="id" value={r.id} />
          <ConfirmButton message={`Remove rule ${r.id} from the draft?`} className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300">Delete rule</ConfirmButton>
        </form>
      )}
    </div>
  );
}
