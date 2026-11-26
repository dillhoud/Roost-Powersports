/**
 * Fitment rules engine. Pure functions over a Catalog, used by the options API,
 * the seller form and server-side validation, so all three agree.
 */
import {
  AFTERMARKET,
  UNKNOWN,
  VERIFIED,
  type Catalog,
  type Conditions,
  type Confidence,
  type EquipmentEntry,
  type Origin,
  type Rule,
  type Selection,
  type TrimRecord,
} from "./types";

export const OTHER_MANUFACTURER = "other";

export interface Option {
  value: string;
  label: string;
  origin: Origin;
  status: Confidence;
  source?: string;
}

export interface FeatureOptions {
  key: string;
  label: string;
  help?: string;
  options: Option[];
  /** All values, for "Aftermarket / added later" (only when the feature allows it). */
  aftermarketValues?: { value: string; label: string }[];
  aftermarketLabel?: string;
}

export type Stage = "year" | "manufacturer" | "family" | "trim" | "package" | "equipment";
export type Verification = "verified" | "partially_verified" | "unverified";

export interface OptionsResult {
  catalogVersion: string;
  selection: Selection;
  /** Selection keys dropped because they no longer fit what came before them. */
  cleared: (keyof Selection)[];
  stage: Stage;
  years: number[];
  manufacturers: { key: string; label: string }[];
  families: { key: string; label: string }[];
  trims: { key: string; label: string; engine: string; status: Confidence }[];
  packages: { key: string; label: string }[];
  features: FeatureOptions[];
  aftermarket: { value: string; label: string }[];
  summary: { title: string; detail?: string; verification: Verification };
  messages: string[];
}

const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));
const isVerified = (s: Confidence) => VERIFIED.includes(s);

// ── catalog lookups ──────────────────────────────────────

export function catalogYears(c: Catalog) {
  return uniq(c.trims.flatMap((t) => t.years)).sort((a, b) => b - a);
}

function trimsFor(c: Catalog, s: Selection) {
  const market = s.market ?? c.market;
  return c.trims.filter(
    (t) =>
      (s.year === undefined || t.years.includes(s.year)) &&
      (!s.manufacturer || t.manufacturer === s.manufacturer) &&
      (!s.family || t.family === s.family) &&
      t.market.includes(market),
  );
}

function findTrim(c: Catalog, s: Selection): TrimRecord | undefined {
  if (!s.trim || s.trim === UNKNOWN) return undefined;
  return trimsFor(c, s).find((t) => t.trim === s.trim);
}

function packagesFor(t: TrimRecord, year?: number) {
  return t.packages.filter((p) => !p.years || year === undefined || p.years.includes(year));
}

/**
 * Drop any part of the selection that doesn't fit what was picked before it,
 * e.g. a trim that wasn't sold in the newly chosen year.
 */
export function normalizeSelection(c: Catalog, input: Selection): { selection: Selection; cleared: (keyof Selection)[] } {
  const s: Selection = { market: input.market ?? c.market };
  const cleared: (keyof Selection)[] = [];
  const drop = (k: keyof Selection) => input[k] !== undefined && input[k] !== "" && cleared.push(k);

  if (input.year !== undefined && catalogYears(c).includes(input.year)) s.year = input.year;
  else drop("year");

  if (s.year !== undefined && input.manufacturer) {
    if (input.manufacturer === OTHER_MANUFACTURER || trimsFor(c, { ...s, manufacturer: input.manufacturer }).length) s.manufacturer = input.manufacturer;
    else drop("manufacturer");
  } else if (input.manufacturer) drop("manufacturer");

  const inCatalog = s.manufacturer && s.manufacturer !== OTHER_MANUFACTURER;
  if (inCatalog && input.family && trimsFor(c, { ...s, family: input.family }).length) s.family = input.family;
  else if (input.family) drop("family");

  if (s.family && input.trim) {
    if (input.trim === UNKNOWN || trimsFor(c, s).some((t) => t.trim === input.trim)) s.trim = input.trim;
    else drop("trim");
  } else if (input.trim) drop("trim");

  const t = findTrim(c, s);
  if (s.trim && input.package) {
    if (input.package === UNKNOWN || (t && packagesFor(t, s.year).some((p) => p.key === input.package))) s.package = input.package;
    else drop("package");
  } else if (input.package) drop("package");

  return { selection: s, cleared };
}

// ── rules ────────────────────────────────────────────────

function matches(w: Conditions, s: Selection, opts: { ignorePackage?: boolean } = {}) {
  const has = (list: string[] | undefined, v: string | undefined) => !list || (v !== undefined && v !== UNKNOWN && list.includes(v));
  if (w.years && (s.year === undefined || !w.years.includes(s.year))) return false;
  if (w.yearRange && (s.year === undefined || s.year < w.yearRange[0] || s.year > w.yearRange[1])) return false;
  if (!has(w.manufacturer, s.manufacturer)) return false;
  if (!has(w.family, s.family)) return false;
  if (!has(w.trim, s.trim)) return false;
  if (w.package && !opts.ignorePackage && !has(w.package, s.package)) return false;
  if (!has(w.market, s.market)) return false;
  return true;
}

/** More conditions = more specific. Exact years count more than a range. */
function specificity(w: Conditions) {
  let n = 0;
  if (w.years) n += 1.5;
  if (w.yearRange) n += 1;
  for (const k of ["manufacturer", "family", "trim", "package", "market"] as const) if (w[k]) n += 1;
  return n;
}

/**
 * Values allowed for one feature. An exclusion removes a value unless a
 * strictly more specific rule allows it again.
 */
function resolveFeature(c: Catalog, feature: string, s: Selection, opts: { ignorePackage?: boolean } = {}) {
  const allowed = new Map<string, { spec: number; origin: Origin; rule: Rule }>();
  const excluded = new Map<string, number>();
  for (const r of c.rules) {
    if (r.feature !== feature || !matches(r.when, s, opts)) continue;
    const spec = specificity(r.when);
    for (const a of r.allow ?? []) {
      const cur = allowed.get(a.value);
      if (!cur || spec >= cur.spec) allowed.set(a.value, { spec, origin: a.origin, rule: r });
    }
    for (const v of r.exclude ?? []) excluded.set(v, Math.max(excluded.get(v) ?? -1, spec));
  }
  const def = c.features.find((f) => f.key === feature)!;
  const out: Option[] = [];
  for (const fv of def.values) {
    const a = allowed.get(fv.value);
    if (!a || (excluded.get(fv.value) ?? -1) >= a.spec) continue;
    out.push({ value: fv.value, label: fv.label, origin: a.origin, status: a.rule.status, source: a.rule.source });
  }
  return out;
}

/** Factory choices for the selection. Needs at least a trim (or "I don't know"). */
export function factoryFeatures(c: Catalog, s: Selection): FeatureOptions[] {
  if (!s.family || !s.trim) return [];
  const trimUnknown = s.trim === UNKNOWN;
  const pkgUnknown = !s.package || s.package === UNKNOWN;
  const candidates = trimUnknown ? trimsFor(c, s) : [findTrim(c, s)!].filter(Boolean);

  const result: FeatureOptions[] = [];
  for (const def of c.features) {
    let options: Option[];
    if (trimUnknown || pkgUnknown) {
      // Not enough detail to know: offer anything any matching config could have had, marked as needing verification.
      const merged = new Map<string, Option>();
      for (const t of candidates) {
        const pkgs = pkgUnknown ? packagesFor(t, s.year).map((p) => p.key) : [s.package!];
        for (const pkg of pkgs.length ? pkgs : [undefined]) {
          for (const o of resolveFeature(c, def.key, { ...s, trim: t.trim, package: pkg })) {
            const prev = merged.get(o.value);
            merged.set(o.value, prev && prev.origin !== o.origin ? { ...o, origin: "unknown", status: "unknown" } : { ...o, status: trimUnknown ? "unknown" : o.status, origin: trimUnknown ? "unknown" : o.origin });
          }
        }
      }
      options = def.values.map((v) => merged.get(v.value)).filter((o): o is Option => !!o);
    } else {
      options = resolveFeature(c, def.key, s);
    }
    if (!options.length && !def.aftermarketChoice) continue;
    result.push({
      key: def.key,
      label: def.label,
      help: def.help,
      options,
      ...(def.aftermarketChoice ? { aftermarketValues: def.values, aftermarketLabel: def.aftermarketChoice } : {}),
    });
  }
  return result;
}

// ── options for the form / API ───────────────────────────

export function optionsFor(c: Catalog, input: Selection): OptionsResult {
  const { selection: s, cleared } = normalizeSelection(c, input);
  const years = catalogYears(c);
  const inYear = s.year !== undefined ? trimsFor(c, { year: s.year, market: s.market }) : [];
  const manufacturers = [
    ...c.manufacturers.filter((m) => inYear.some((t) => t.manufacturer === m.key)),
    ...(s.year !== undefined ? [{ key: OTHER_MANUFACTURER, label: "Other / not listed" }] : []),
  ];
  const inMake = s.manufacturer ? inYear.filter((t) => t.manufacturer === s.manufacturer) : [];
  const families = uniq(inMake.map((t) => t.family)).map((f) => ({ key: f, label: inMake.find((t) => t.family === f)!.familyLabel }));
  const inFamily = s.family ? inMake.filter((t) => t.family === s.family) : [];
  const trims = inFamily.map((t) => ({ key: t.trim, label: t.trimLabel, engine: t.engine, status: t.status }));
  const trim = findTrim(c, s);
  const packages = trim ? packagesFor(trim, s.year).map((p) => ({ key: p.key, label: p.label })) : [];

  const stage: Stage =
    s.year === undefined ? "year" : !s.manufacturer ? "manufacturer" : s.manufacturer === OTHER_MANUFACTURER ? "equipment" : !s.family ? "family" : !s.trim ? "trim" : s.trim !== UNKNOWN && !s.package ? "package" : "equipment";

  const features = stage === "equipment" && s.manufacturer !== OTHER_MANUFACTURER ? factoryFeatures(c, s) : [];
  const messages: string[] = [];
  if (s.family && !s.trim) messages.push("Select the exact model and package to see the correct track, gauge, suspension and factory-option choices.");
  if (s.trim === UNKNOWN) messages.push("Without the exact model, every factory choice is marked as needing verification. The listing will be saved as an unverified configuration.");
  if (s.trim && s.trim !== UNKNOWN && s.package === UNKNOWN) messages.push("Without the package, choices that depend on track length are marked as needing verification.");
  if (s.manufacturer === OTHER_MANUFACTURER) messages.push("This make isn't in the catalog yet. Describe the equipment under Aftermarket modifications and notes; it will be saved as seller-reported.");
  const seed = (trim && !isVerified(trim.status)) || features.some((f) => f.options.some((o) => o.status === "seed_unverified"));
  if (seed) messages.push("Catalog data for this model is seed data and hasn't been checked against the manufacturer's catalog yet.");

  const familyLabel = families.find((f) => f.key === s.family)?.label;
  const makeLabel = manufacturers.find((m) => m.key === s.manufacturer)?.label;
  const title = [s.year, makeLabel, trim ? trim.trimLabel : familyLabel].filter(Boolean).join(" ") || "New snowmobile listing";
  const pkgLabel = packages.find((p) => p.key === s.package)?.label;
  const detail = [trim?.engine, pkgLabel].filter(Boolean).join(" · ") || undefined;

  return {
    catalogVersion: c.version,
    selection: s,
    cleared,
    stage,
    years,
    manufacturers,
    families,
    trims,
    packages,
    features,
    aftermarket: c.aftermarket,
    summary: { title, detail, verification: verificationFor(trim, s, features) },
    messages,
  };
}

function verificationFor(trim: TrimRecord | undefined, s: Selection, features: FeatureOptions[]): Verification {
  if (!trim || s.package === UNKNOWN) return "unverified";
  if (!isVerified(trim.status)) return "unverified";
  const all = features.flatMap((f) => f.options);
  return all.length && all.every((o) => isVerified(o.status)) ? "verified" : "partially_verified";
}

// ── validation of a submitted listing ────────────────────

export interface ListingConfigInput {
  selection: Selection;
  /** Feature key → chosen value, UNKNOWN, or AFTERMARKET. Missing = unknown. */
  factory: Record<string, string | undefined>;
  /** For features answered AFTERMARKET: which value was fitted later. */
  factoryAftermarket?: Record<string, string | undefined>;
  aftermarket: { key: string; note?: string }[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  catalogVersion: string;
  selection: Selection;
  identity: { title: string; engine?: string; package?: string; trimSource?: string; trimStatus: Confidence };
  equipment: EquipmentEntry[];
  aftermarket: { key: string; label: string; note?: string; origin: "aftermarket"; catalog_status: "seller_reported" }[];
  verification: Verification;
}

export function validateConfig(c: Catalog, input: ListingConfigInput): ValidationResult {
  const errors: ValidationError[] = [];
  const opts = optionsFor(c, input.selection);
  const s = opts.selection;
  for (const k of opts.cleared) errors.push({ field: k, message: `The ${k} you chose doesn't fit the earlier choices. Pick it again.` });
  if (s.year === undefined) errors.push({ field: "year", message: "Choose the model year." });
  else if (!s.manufacturer) errors.push({ field: "manufacturer", message: "Choose the manufacturer." });
  else if (s.manufacturer !== OTHER_MANUFACTURER) {
    if (!s.family) errors.push({ field: "family", message: "Choose the model family." });
    else if (!s.trim) errors.push({ field: "trim", message: "Choose the exact model, or \"I don't know\"." });
    else if (s.trim !== UNKNOWN && !s.package) errors.push({ field: "package", message: "Choose the package, or \"I don't know\"." });
  }

  const trim = findTrim(c, s);
  const trimLabel = trim?.trimLabel ?? "configuration";
  const equipment: EquipmentEntry[] = [];
  const byKey = new Map(opts.features.map((f) => [f.key, f]));

  for (const [key, raw] of Object.entries(input.factory)) {
    if (raw === undefined || raw === "") continue;
    const f = byKey.get(key);
    const def = c.features.find((d) => d.key === key);
    if (!f || !def) {
      errors.push({ field: key, message: `${def?.label ?? key} doesn't apply to this ${trimLabel}. Add it under Aftermarket modifications instead.` });
      continue;
    }
    if (raw === UNKNOWN) {
      equipment.push({ feature: key, value: UNKNOWN, origin: "unknown", catalog_status: "unknown" });
      continue;
    }
    if (raw === AFTERMARKET) {
      const v = input.factoryAftermarket?.[key];
      if (!f.aftermarketValues || !v || !f.aftermarketValues.some((x) => x.value === v)) {
        errors.push({ field: key, message: `Choose which ${def.label.toLowerCase()} was fitted later.` });
        continue;
      }
      equipment.push({ feature: key, value: v, origin: "aftermarket", catalog_status: "seller_reported" });
      continue;
    }
    const o = f.options.find((x) => x.value === raw);
    if (!o) {
      const valueLabel = def.values.find((v) => v.value === raw)?.label ?? raw;
      errors.push({
        field: key,
        message:
          key === "gauge_display"
            ? `${valueLabel} isn't listed as factory equipment for the ${trimLabel}. Add it under Aftermarket modifications or choose a valid factory gauge.`
            : `${valueLabel} isn't listed as factory ${def.label.toLowerCase()} for the ${trimLabel}. Add it under Aftermarket modifications or choose a valid factory option.`,
      });
      continue;
    }
    equipment.push({ feature: key, value: o.value, origin: o.origin, catalog_status: o.status, source_reference: o.source });
  }
  // Features left blank are recorded as unknown, so the listing says so rather than implying "none".
  for (const f of opts.features) {
    if (!equipment.some((e) => e.feature === f.key) && !errors.some((e) => e.field === f.key)) {
      equipment.push({ feature: f.key, value: UNKNOWN, origin: "unknown", catalog_status: "unknown" });
    }
  }

  const aftermarket: ValidationResult["aftermarket"] = [];
  for (const a of input.aftermarket) {
    const def = c.aftermarket.find((x) => x.value === a.key);
    if (!def) {
      errors.push({ field: "aftermarket", message: `Unknown modification: ${a.key}` });
      continue;
    }
    if (a.key === "other" && !a.note?.trim()) {
      errors.push({ field: "aftermarket", message: "Describe the other modification." });
      continue;
    }
    aftermarket.push({ key: a.key, label: def.label, note: a.note?.trim() || undefined, origin: "aftermarket", catalog_status: "seller_reported" });
  }

  const factory = equipment.filter((e) => e.origin !== "aftermarket");
  let verification: Verification = opts.summary.verification;
  if (verification === "verified" && factory.some((e) => e.origin === "unknown" || !isVerified(e.catalog_status))) verification = "partially_verified";

  return {
    ok: errors.length === 0,
    errors,
    catalogVersion: c.version,
    selection: s,
    identity: {
      title: opts.summary.title,
      engine: trim?.engine,
      package: opts.packages.find((p) => p.key === s.package)?.label ?? (s.package === UNKNOWN ? "Unknown package" : undefined),
      trimSource: trim?.source,
      trimStatus: trim?.status ?? "seller_reported",
    },
    equipment,
    aftermarket,
    verification,
  };
}
