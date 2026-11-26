"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createSnowmobileListing, type ListingFormState } from "@/app/admin/listing-actions";
import type { OptionsResult } from "@/lib/fitment/engine";
import { AFTERMARKET, UNKNOWN, VERIFIED, type Origin, type Selection } from "@/lib/fitment/types";

const ORIGIN_LABEL: Record<Origin, string> = {
  factory_standard: "Factory standard",
  factory_option: "Factory option",
  factory_package: "Factory package equipment",
  dealer_accessory: "Dealer-installed accessory",
  aftermarket: "Aftermarket",
  unknown: "Needs verification",
};

const VERIFICATION_LABEL = {
  verified: "Catalog verified",
  partially_verified: "Partially verified",
  unverified: "Not verified",
} as const;

type Answers = Record<string, string>;

/**
 * `catalog="draft"` reads choices from the catalog being edited; `preview` checks the
 * configuration and shows how it would be saved, without creating a listing.
 */
export function SnowmobileConfigurator({ initial, catalog, preview }: { initial: OptionsResult; catalog?: "draft"; preview?: boolean }) {
  const [opts, setOpts] = useState(initial);
  const [sel, setSel] = useState<Selection>(initial.selection);
  // Everything the seller has answered, kept even when a later step is hidden, so going back doesn't lose work.
  const [remembered, setRemembered] = useState<Answers>({});
  const [rememberedAm, setRememberedAm] = useState<Answers>({});
  const [mods, setMods] = useState<Record<string, string | undefined>>({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const req = useRef(0);
  const [state, action, submitting] = useActionState<ListingFormState, FormData>(createSnowmobileListing, { errors: [] });

  async function choose(patch: Partial<Selection>) {
    const next = { ...sel, ...patch };
    setSel(next);
    const id = ++req.current;
    setLoading(true);
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v !== undefined && v !== "" && k !== "market") q.set(k, String(v));
    if (catalog) q.set("catalog", catalog);
    try {
      const res = await fetch(`/api/snowmobiles/fitment/options?${q}`);
      const data: OptionsResult = await res.json();
      if (id !== req.current) return; // a newer choice is already loading
      setOpts(data);
      setSel(data.selection);
      const what = data.trims.find((t) => t.key === data.selection.trim)?.label ?? data.families.find((f) => f.key === data.selection.family)?.label;
      setNotice(
        data.cleared.length
          ? `Some later choices no longer fit and were cleared (${data.cleared.join(", ")}).`
          : data.stage === "equipment" && what
            ? `Options updated for ${what}.`
            : "",
      );
    } finally {
      if (id === req.current) setLoading(false);
    }
  }

  // Only answers that are still valid for the current configuration count.
  const factory = useMemo(() => {
    const out: Answers = {};
    for (const f of opts.features) {
      const a = remembered[f.key];
      if (!a) continue;
      if (a === UNKNOWN || (a === AFTERMARKET && f.aftermarketValues) || f.options.some((o) => o.value === a)) out[f.key] = a;
    }
    return out;
  }, [opts.features, remembered]);
  const factoryAm = useMemo(() => {
    const out: Answers = {};
    for (const f of opts.features) if (factory[f.key] === AFTERMARKET && rememberedAm[f.key]) out[f.key] = rememberedAm[f.key];
    return out;
  }, [opts.features, factory, rememberedAm]);

  const factoryDone = opts.stage === "equipment" && opts.features.every((f) => factory[f.key] && (factory[f.key] !== AFTERMARKET || factoryAm[f.key]));
  const showMods = opts.stage === "equipment" && (factoryDone || opts.features.length === 0);
  const config = JSON.stringify({
    selection: sel,
    factory,
    factoryAftermarket: factoryAm,
    aftermarket: Object.entries(mods)
      .filter(([, v]) => v !== undefined)
      .map(([key, note]) => ({ key, note })),
  });
  const errorFor = (field: string) => state.errors.filter((e) => e.field === field);
  const unanswered = opts.features.filter((f) => !factory[f.key]).length;

  useEffect(() => {
    if (state.errors.length) document.getElementById("form-errors")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  const isNew = useMemo(() => sel.year !== undefined && sel.year >= 2026, [sel.year]);

  return (
    <form
      // Submit by hand so React doesn't reset the fields when the server sends back errors.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start"
    >
      <input type="hidden" name="config" value={config} />
      {preview && <input type="hidden" name="preview" value={catalog ?? "live"} />}
      <div className="min-w-0 space-y-6">
        {state.errors.length > 0 && (
          <div id="form-errors" role="alert" className="rounded-sm border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="font-semibold">Fix these before the listing can be saved:</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">{state.errors.map((e, i) => <li key={i}>{e.message}</li>)}</ul>
          </div>
        )}

        {/* 1. Machine */}
        <section className="card p-5">
          <h2 className="font-semibold text-white">1. Machine</h2>
          <p className="mt-1 text-sm text-zinc-500">Each choice narrows the next one to what was actually sold.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select label="Model year" value={sel.year?.toString() ?? ""} onChange={(v) => choose({ year: v ? Number(v) : undefined })} placeholder="Choose a year…" options={opts.years.map((y) => ({ value: String(y), label: String(y) }))} />
            {sel.year !== undefined && (
              <Select label="Manufacturer" value={sel.manufacturer ?? ""} onChange={(v) => choose({ manufacturer: v || undefined })} placeholder="Choose…" options={opts.manufacturers.map((m) => ({ value: m.key, label: m.label }))} />
            )}
            {sel.manufacturer && opts.families.length > 0 && (
              <Select label="Model family" value={sel.family ?? ""} onChange={(v) => choose({ family: v || undefined })} placeholder="Choose…" options={opts.families.map((f) => ({ value: f.key, label: f.label }))} />
            )}
            {sel.family && (
              <Select
                label="Exact model / trim"
                value={sel.trim ?? ""}
                onChange={(v) => choose({ trim: v || undefined })}
                placeholder="Choose…"
                options={[...opts.trims.map((t) => ({ value: t.key, label: `${t.label} (${t.engine})` })), { value: UNKNOWN, label: "I don't know" }]}
              />
            )}
            {sel.trim && sel.trim !== UNKNOWN && (
              <Select label="Package" value={sel.package ?? ""} onChange={(v) => choose({ package: v || undefined })} placeholder="Choose…" options={[...opts.packages.map((p) => ({ value: p.key, label: p.label })), { value: UNKNOWN, label: "I don't know" }]} />
            )}
          </div>
          <div aria-live="polite" className="mt-4 space-y-2 text-sm">
            {loading && <p className="text-zinc-500">Updating choices…</p>}
            {notice && !loading && <p className="text-emerald-300">{notice}</p>}
            {opts.messages.map((m) => <p key={m} className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200">{m}</p>)}
          </div>
        </section>

        {/* 2. Factory equipment */}
        {opts.stage === "equipment" && opts.features.length > 0 && (
          <section className="card p-5">
            <h2 className="font-semibold text-white">2. Factory equipment</h2>
            <p className="mt-1 text-sm text-zinc-500">Only choices this configuration could have come with. If something was added later, pick the aftermarket choice or list it in step 3.</p>
            <div className="mt-4 space-y-5">
              {opts.features.map((f) => (
                <fieldset key={f.key} className={errorFor(f.key).length ? "rounded-sm border border-red-500/40 p-3" : ""}>
                  <legend className="label">{f.label}</legend>
                  {f.help && <p className="-mt-1 mb-2 text-xs text-zinc-600">{f.help}</p>}
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {f.options.map((o) => (
                      <Radio key={o.value} name={f.key} checked={factory[f.key] === o.value} onChange={() => setRemembered({ ...remembered, [f.key]: o.value })}>
                        {o.label}
                        <span className="block text-xs text-zinc-500">
                          {ORIGIN_LABEL[o.origin]}
                          {!VERIFIED.includes(o.status) && o.origin !== "unknown" && " · not yet verified"}
                        </span>
                      </Radio>
                    ))}
                    {f.aftermarketValues && (
                      <Radio name={f.key} checked={factory[f.key] === AFTERMARKET} onChange={() => setRemembered({ ...remembered, [f.key]: AFTERMARKET })}>
                        {f.aftermarketLabel}
                        <span className="block text-xs text-zinc-500">Fitted after it left the factory</span>
                      </Radio>
                    )}
                    <Radio name={f.key} checked={factory[f.key] === UNKNOWN} onChange={() => setRemembered({ ...remembered, [f.key]: UNKNOWN })}>
                      I don&apos;t know
                    </Radio>
                  </div>
                  {factory[f.key] === AFTERMARKET && f.aftermarketValues && (
                    <div className="mt-2 max-w-sm">
                      <Select label={`Which ${f.label.toLowerCase()} is fitted?`} value={factoryAm[f.key] ?? ""} onChange={(v) => setRememberedAm({ ...rememberedAm, [f.key]: v })} placeholder="Choose…" options={f.aftermarketValues} />
                    </div>
                  )}
                  {errorFor(f.key).map((e, i) => <p key={i} className="mt-2 text-sm text-red-300">{e.message}</p>)}
                </fieldset>
              ))}
            </div>
          </section>
        )}

        {/* 3. Aftermarket */}
        {opts.stage === "equipment" && (
          <section className="card p-5">
            <h2 className="font-semibold text-white">3. Aftermarket modifications</h2>
            {!showMods ? (
              <p className="mt-2 text-sm text-zinc-500">Answer each factory item above first (&quot;I don&apos;t know&quot; is fine). {unanswered > 0 && `${unanswered} left.`}</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-zinc-500">Anything added or changed after it left the factory. These are shown to buyers as seller-reported.</p>
                <div className="mt-4 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {opts.aftermarket.map((a) => (
                    <label key={a.value} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={mods[a.value] !== undefined}
                        onChange={(e) => setMods({ ...mods, [a.value]: e.target.checked ? "" : undefined })}
                        className="accent-brand-500"
                      />
                      {a.label}
                    </label>
                  ))}
                </div>
                {Object.keys(mods).filter((k) => mods[k] !== undefined).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(mods)
                      .filter(([, v]) => v !== undefined)
                      .map(([k, v]) => (
                        <label key={k} className="block">
                          <span className="label">{opts.aftermarket.find((a) => a.value === k)?.label}: details{k === "other" ? "" : " (optional)"}</span>
                          <input value={v ?? ""} onChange={(e) => setMods({ ...mods, [k]: e.target.value })} placeholder="Brand, part, when it was done…" className="field" />
                        </label>
                      ))}
                  </div>
                )}
                {errorFor("aftermarket").map((e, i) => <p key={i} className="mt-2 text-sm text-red-300">{e.message}</p>)}
              </>
            )}
          </section>
        )}

        {preview && showMods && (
          <section className="card p-5">
            <button disabled={submitting} className="btn-primary">{submitting ? "Checking…" : "Preview listing output"}</button>
            {state.preview && <PreviewOutput result={state.preview} />}
          </section>
        )}

        {/* 4. Listing details */}
        {showMods && !preview && (
          <section className="card p-5">
            <h2 className="font-semibold text-white">4. Condition, history &amp; price</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Asking price (CAD)" name="price" type="number" errors={errorFor("price")} />
              <label className="block">
                <span className="label">Price type</span>
                <select name="priceType" className="field" defaultValue="negotiable">
                  <option value="negotiable">Negotiable</option>
                  <option value="fixed">No-haggle price</option>
                </select>
              </label>
              <Field label="Kilometres" name="km" type="number" errors={errorFor("km")} defaultValue={isNew ? "0" : undefined} />
              <Field label="VIN or serial (optional)" name="vin" errors={errorFor("vin")} />
              <label className="block">
                <span className="label">Condition</span>
                <select name="grade" className="field" defaultValue={isNew ? "New" : "Very good"}>
                  {["New", "Excellent", "Very good", "Good", "Fair"].map((g) => <option key={g}>{g}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Title</span>
                <select name="titleStatus" className="field" defaultValue="Clean">
                  <option>Clean</option>
                  <option>Rebuilt</option>
                </select>
              </label>
              <Field label="Previous owners" name="owners" type="number" errors={errorFor("owners")} defaultValue={isNew ? "0" : "1"} />
              <label className="block">
                <span className="label">Service records</span>
                <select name="serviceRecords" className="field" defaultValue="partial">
                  <option value="full">Full history</option>
                  <option value="partial">Some records</option>
                  <option value="none">None</option>
                </select>
              </label>
              <Field label="Colour" name="colour" />
              <label className="block">
                <span className="label">Status</span>
                <select name="status" className="field" defaultValue="active">
                  <option value="active">Active</option>
                  <option value="pending">Sale pending</option>
                  <option value="sold">Sold</option>
                  <option value="expired">Expired</option>
                </select>
              </label>
              <Field label="Dealership" name="dealer" errors={errorFor("dealer")} />
              <Field label="Dealer postal code" name="postalCode" errors={errorFor("postalCode")} placeholder="T2P 1J9" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="financing" className="accent-brand-500" /> Financing available</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="delivery" className="accent-brand-500" /> Delivery available</label>
              <label className="block sm:col-span-2">
                <span className="label">Notes for buyers (optional)</span>
                <textarea name="notes" rows={3} className="field" />
              </label>
            </div>
            <button disabled={submitting} className="btn-primary mt-6 w-full sm:w-auto">{submitting ? "Checking…" : "Save listing"}</button>
          </section>
        )}
      </div>

      {/* Live summary */}
      <aside className="card space-y-3 p-5 text-sm lg:sticky lg:top-20">
        <div className="eyebrow text-zinc-500">Summary</div>
        <div className="font-display text-2xl font-bold uppercase italic leading-tight text-white">{opts.summary.title}</div>
        {opts.summary.detail && <div className="text-zinc-400">{opts.summary.detail}</div>}
        <div>
          <span className="text-zinc-500">Factory configuration: </span>
          <span className={opts.summary.verification === "verified" ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"}>
            {VERIFICATION_LABEL[opts.summary.verification]}
          </span>
        </div>
        {opts.stage === "equipment" && opts.features.length > 0 && (
          <ul className="space-y-1 border-t border-carbon-800 pt-3">
            {opts.features.map((f) => {
              const a = factory[f.key];
              const label = a === UNKNOWN ? "Unknown" : a === AFTERMARKET ? `${f.aftermarketValues?.find((v) => v.value === factoryAm[f.key])?.label ?? "…"} (aftermarket)` : f.options.find((o) => o.value === a)?.label;
              return (
                <li key={f.key} className="flex justify-between gap-3">
                  <span className="text-zinc-500">{f.label}</span>
                  <span className={label ? "text-right text-zinc-200" : "text-zinc-600"}>{label ?? "—"}</span>
                </li>
              );
            })}
          </ul>
        )}
        {Object.values(mods).some((v) => v !== undefined) && (
          <div className="border-t border-carbon-800 pt-3 text-zinc-400">
            Aftermarket: {Object.keys(mods).filter((k) => mods[k] !== undefined).map((k) => opts.aftermarket.find((a) => a.value === k)?.label).join(", ")}
          </div>
        )}
        <div className="border-t border-carbon-800 pt-3 text-xs text-zinc-600">Catalog {opts.catalogVersion}</div>
      </aside>
    </form>
  );
}

function PreviewOutput({ result }: { result: NonNullable<ListingFormState["preview"]> }) {
  return (
    <div className="mt-4 space-y-3 text-sm">
      <div className="font-display text-xl font-bold uppercase italic text-white">{result.identity.title}</div>
      <div className="text-zinc-400">{[result.identity.engine, result.identity.package].filter(Boolean).join(" · ")}</div>
      <div>
        Would be saved as: <b className={result.verification === "verified" ? "text-emerald-300" : "text-amber-300"}>{VERIFICATION_LABEL[result.verification]}</b>
        {!result.ok && <span className="text-red-300"> (blocked: {result.errors.length} problem{result.errors.length > 1 ? "s" : ""})</span>}
      </div>
      <table className="w-full text-left">
        <thead className="text-xs uppercase tracking-wider text-zinc-500"><tr><th className="py-1">Feature</th><th>Value</th><th>Origin</th><th>Status</th></tr></thead>
        <tbody>
          {result.equipment.map((e) => (
            <tr key={e.feature} className="border-t border-carbon-800"><td className="py-1.5 text-zinc-400">{e.feature}</td><td>{e.value}</td><td>{ORIGIN_LABEL[e.origin]}</td><td className="text-zinc-500">{e.catalog_status}</td></tr>
          ))}
          {result.aftermarket.map((a) => (
            <tr key={a.key} className="border-t border-carbon-800"><td className="py-1.5 text-zinc-400">{a.label}</td><td>{a.note ?? ""}</td><td>Aftermarket</td><td className="text-zinc-500">{a.catalog_status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Radio({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2 rounded-sm border p-2.5 text-sm ${checked ? "border-brand-500 bg-brand-500/10" : "border-carbon-800 hover:border-carbon-600"}`}>
      <input type="radio" name={`f-${name}`} checked={checked} onChange={onChange} className="mt-0.5 accent-brand-500" />
      <span>{children}</span>
    </label>
  );
}

function Field({ label, name, type = "text", errors = [], defaultValue, placeholder }: { label: string; name: string; type?: string; errors?: { message: string }[]; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} className={`field ${errors.length ? "border-red-500" : ""}`} />
      {errors.map((e, i) => <span key={i} className="mt-1 block text-xs text-red-300">{e.message}</span>)}
    </label>
  );
}
