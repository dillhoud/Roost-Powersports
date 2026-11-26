/**
 * Pure helpers for editing a catalog: integrity checks, CSV import and
 * "which listings would this change affect". No database access here.
 */
import { optionsFor } from "./engine";
import type { Catalog, Conditions, Confidence, Origin, Rule, TrimRecord } from "./types";

export const CONFIDENCES: Confidence[] = [
  "verified_manufacturer_source",
  "verified_dealer_catalog",
  "verified_spec_database",
  "admin_verified",
  "seller_reported",
  "seed_unverified",
  "unknown",
];
export const RULE_ORIGINS: Exclude<Origin, "aftermarket" | "unknown">[] = ["factory_standard", "factory_option", "factory_package", "dealer_accessory"];

// ── integrity ────────────────────────────────────────────

/** Problems that would make the catalog wrong or confusing. Publishing is blocked while any exist. */
export function checkCatalog(c: Catalog): string[] {
  const out: string[] = [];
  const dup = (label: string, keys: string[]) => {
    const seen = new Set<string>();
    for (const k of keys) {
      if (seen.has(k)) out.push(`Duplicate ${label}: ${k}`);
      seen.add(k);
    }
  };
  if (!c.version) out.push("Catalog has no version");
  dup("manufacturer", c.manufacturers.map((m) => m.key));
  dup("feature", c.features.map((f) => f.key));
  dup("trim id", c.trims.map((t) => t.id));
  dup("rule id", c.rules.map((r) => r.id));
  dup("source id", c.sources.map((s) => s.id));
  dup("aftermarket value", c.aftermarket.map((a) => a.value));
  for (const f of c.features) dup(`value in ${f.key}`, f.values.map((v) => v.value));

  const makes = new Set(c.manufacturers.map((m) => m.key));
  const sources = new Set(c.sources.map((s) => s.id));
  const trimKeys = new Set(c.trims.map((t) => t.trim));
  const families = new Set(c.trims.map((t) => t.family));
  const packages = new Set(c.trims.flatMap((t) => t.packages.map((p) => p.key)));

  const seenTrim = new Map<string, string>();
  for (const t of c.trims) {
    const where = `Trim ${t.id}`;
    if (!makes.has(t.manufacturer)) out.push(`${where}: unknown manufacturer "${t.manufacturer}"`);
    if (!t.family || !t.trim || !t.trimLabel || !t.familyLabel) out.push(`${where}: family, trim and their labels are required`);
    if (!t.years.length || t.years.some((y) => !Number.isInteger(y) || y < 1960 || y > 2100)) out.push(`${where}: needs valid years`);
    if (!t.packages.length) out.push(`${where}: needs at least one package`);
    if (!t.market.length) out.push(`${where}: needs at least one market`);
    if (!sources.has(t.source)) out.push(`${where}: unknown source "${t.source}"`);
    if (!CONFIDENCES.includes(t.status)) out.push(`${where}: unknown status "${t.status}"`);
    // The same trim key may appear twice only if the years don't overlap.
    for (const y of t.years) {
      const k = `${t.manufacturer}/${t.family}/${t.trim}/${y}`;
      if (seenTrim.has(k)) out.push(`${where}: ${t.trim} ${y} is already defined by ${seenTrim.get(k)}`);
      seenTrim.set(k, t.id);
    }
  }

  for (const r of c.rules) {
    const where = `Rule ${r.id}`;
    const f = c.features.find((x) => x.key === r.feature);
    if (!f) {
      out.push(`${where}: unknown feature "${r.feature}"`);
      continue;
    }
    if (!r.allow?.length && !r.exclude?.length) out.push(`${where}: allows and excludes nothing`);
    const vals = new Set(f.values.map((v) => v.value));
    for (const a of r.allow ?? []) {
      if (!vals.has(a.value)) out.push(`${where}: "${a.value}" isn't a ${f.label} value`);
      if (!RULE_ORIGINS.includes(a.origin)) out.push(`${where}: unknown origin "${a.origin}"`);
    }
    for (const v of r.exclude ?? []) if (!vals.has(v)) out.push(`${where}: excludes "${v}", which isn't a ${f.label} value`);
    const w = r.when;
    for (const m of w.manufacturer ?? []) if (!makes.has(m)) out.push(`${where}: unknown manufacturer "${m}"`);
    for (const x of w.family ?? []) if (!families.has(x)) out.push(`${where}: no trim uses family "${x}"`);
    for (const x of w.trim ?? []) if (!trimKeys.has(x)) out.push(`${where}: no trim "${x}"`);
    for (const x of w.package ?? []) if (!packages.has(x)) out.push(`${where}: no package "${x}"`);
    if (w.yearRange && (w.yearRange.length !== 2 || w.yearRange[0] > w.yearRange[1])) out.push(`${where}: year range must be "from-to"`);
    if (!sources.has(r.source)) out.push(`${where}: unknown source "${r.source}"`);
    if (!CONFIDENCES.includes(r.status)) out.push(`${where}: unknown status "${r.status}"`);
  }
  return out;
}

// ── parsing helpers shared by forms and CSV ──────────────

/** "2023, 2024" or "2021-2024" → [2021, 2022, 2023, 2024]. */
export function parseYears(s: string): number[] {
  const out = new Set<number>();
  for (const part of s.split(/[,;\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d{4})(?:-(\d{4}))?$/);
    if (!m) throw new Error(`Not a year or range: "${part}"`);
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (b < a || b - a > 50) throw new Error(`Bad year range: "${part}"`);
    for (let y = a; y <= b; y++) out.add(y);
  }
  return [...out].sort((x, y) => x - y);
}

export const list = (s: string | undefined) => (s ?? "").split(/[,;|]/).map((x) => x.trim()).filter(Boolean);

/** "154:154 in track, 165:165 in track" or just "154, 165". */
export function parsePackages(s: string): TrimRecord["packages"] {
  return list(s).map((p) => {
    const [key, label] = p.split(":").map((x) => x.trim());
    return { key, label: label || `${key} in track` };
  });
}

/** "basic_lcd:factory_standard, large_color_display:factory_option". */
export function parseAllow(s: string): NonNullable<Rule["allow"]> {
  return list(s).map((p) => {
    const [value, origin = "factory_standard"] = p.split(":").map((x) => x.trim());
    if (!RULE_ORIGINS.includes(origin as (typeof RULE_ORIGINS)[number])) throw new Error(`Unknown origin "${origin}" for ${value}`);
    return { value, origin: origin as (typeof RULE_ORIGINS)[number] };
  });
}

export function conditionsFrom(get: (k: string) => string | undefined): Conditions {
  const w: Conditions = {};
  const years = get("years")?.trim();
  if (years) w.years = parseYears(years);
  const range = get("year_range")?.trim();
  if (range) {
    const ys = parseYears(range);
    w.yearRange = [ys[0], ys[ys.length - 1]];
  }
  for (const k of ["manufacturer", "family", "trim", "package", "market"] as const) {
    const v = list(get(k));
    if (v.length) w[k] = v;
  }
  return w;
}

// ── CSV ──────────────────────────────────────────────────

/** Minimal RFC 4180 CSV parser: quoted fields, doubled quotes, commas and newlines in quotes. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  if (!header) return [];
  const keys = header.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

export const TRIM_CSV_COLUMNS = ["id", "manufacturer", "family", "family_label", "trim", "trim_label", "years", "engine", "packages", "market", "source", "status"];
export const RULE_CSV_COLUMNS = ["id", "feature", "years", "year_range", "manufacturer", "family", "trim", "package", "market", "allow", "exclude", "source", "status", "note"];

export function trimsFromCsv(text: string): TrimRecord[] {
  return parseCsv(text).map((r, i) => {
    const line = `Row ${i + 2}`;
    try {
      const trim = r.trim;
      if (!r.manufacturer || !r.family || !trim) throw new Error("manufacturer, family and trim are required");
      return {
        id: r.id || `${r.manufacturer}-${trim}`,
        manufacturer: r.manufacturer,
        family: r.family,
        familyLabel: r.family_label || r.family,
        trim,
        trimLabel: r.trim_label || trim,
        years: parseYears(r.years ?? ""),
        engine: r.engine ?? "",
        packages: parsePackages(r.packages ?? ""),
        market: list(r.market).length ? list(r.market) : ["CA"],
        source: r.source || "",
        status: (r.status || "unknown") as Confidence,
      };
    } catch (e) {
      throw new Error(`${line}: ${(e as Error).message}`);
    }
  });
}

export function rulesFromCsv(text: string): Rule[] {
  return parseCsv(text).map((r, i) => {
    const line = `Row ${i + 2}`;
    try {
      if (!r.id || !r.feature) throw new Error("id and feature are required");
      return {
        id: r.id,
        feature: r.feature,
        when: conditionsFrom((k) => r[k]),
        ...(r.allow ? { allow: parseAllow(r.allow) } : {}),
        ...(r.exclude ? { exclude: list(r.exclude) } : {}),
        source: r.source || "",
        status: (r.status || "unknown") as Confidence,
        ...(r.note ? { note: r.note } : {}),
      };
    } catch (e) {
      throw new Error(`${line}: ${(e as Error).message}`);
    }
  });
}

/** Add or replace by id. Returns how many were added and replaced. */
export function upsert<T extends { id: string }>(existing: T[], incoming: T[]) {
  const byId = new Map(existing.map((x) => [x.id, x]));
  let added = 0;
  let replaced = 0;
  for (const x of incoming) {
    if (byId.has(x.id)) replaced++;
    else added++;
    byId.set(x.id, x);
  }
  return { items: [...byId.values()], added, replaced };
}

// ── affected listings ────────────────────────────────────

export interface ListingRef {
  id: string;
  title: string;
  year: number;
  manufacturer: string;
  family: string | null;
  trim: string | null;
  package: string | null;
  equipment: { feature: string; value: string; origin: string }[];
}

export interface Impact {
  id: string;
  title: string;
  reasons: string[];
}

/**
 * Listings whose machine would be offered different choices under the new
 * catalog, or whose saved factory equipment would no longer be valid. Saved
 * listings keep their equipment either way; this tells you which to review.
 */
export function affectedListings(before: Catalog, after: Catalog, listings: ListingRef[]): Impact[] {
  const out: Impact[] = [];
  for (const l of listings) {
    const sel = { year: l.year, manufacturer: l.manufacturer, family: l.family ?? undefined, trim: l.trim ?? undefined, package: l.package ?? undefined };
    const a = optionsFor(before, sel);
    const b = optionsFor(after, sel);
    const reasons: string[] = [];
    if (b.cleared.length) reasons.push(`Its ${b.cleared.join(", ")} is no longer in the catalog`);
    const sig = (o: typeof a) => new Map(o.features.map((f) => [f.key, f.options.map((x) => `${x.value}:${x.origin}`).sort().join(",")]));
    const sa = sig(a);
    const sb = sig(b);
    for (const k of new Set([...sa.keys(), ...sb.keys()])) {
      if (sa.get(k) !== sb.get(k)) reasons.push(`${after.features.find((f) => f.key === k)?.label ?? before.features.find((f) => f.key === k)?.label ?? k} choices change`);
    }
    for (const e of l.equipment) {
      if (e.origin === "aftermarket" || e.origin === "unknown") continue;
      const f = b.features.find((x) => x.key === e.feature);
      const o = f?.options.find((x) => x.value === e.value);
      if (!o) reasons.push(`Saved ${e.feature} "${e.value}" would no longer be valid factory equipment`);
      else if (o.origin !== e.origin) reasons.push(`Saved ${e.feature} "${e.value}" would change from ${e.origin} to ${o.origin}`);
    }
    if (reasons.length) out.push({ id: l.id, title: l.title, reasons: [...new Set(reasons)] });
  }
  return out;
}

/** Next version name, e.g. 2026.11.26-2 when 2026.11.26-1 already exists. */
export function nextVersionName(existing: string[], now = new Date()) {
  const day = now.toISOString().slice(0, 10).replace(/-/g, ".");
  let n = 1;
  while (existing.includes(`${day}-${n}`)) n++;
  return `${day}-${n}`;
}
