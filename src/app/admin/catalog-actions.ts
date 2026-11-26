"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { hasDb } from "@/lib/db";
import { CONFIDENCES, conditionsFrom, list, parseAllow, parsePackages, parseYears, rulesFromCsv, trimsFromCsv, upsert } from "@/lib/fitment/catalog-tools";
import { discardDraft, ensureDraft, publishDraft, rollbackTo, saveDraft } from "@/lib/fitment/store";
import type { Catalog, Confidence, Rule, TrimRecord } from "@/lib/fitment/types";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const go = (path: string, params: Record<string, string>): never => redirect(`${path}?${new URLSearchParams(params)}`);
const status = (v: string): Confidence => (CONFIDENCES.includes(v as Confidence) ? (v as Confidence) : "unknown");

async function guard() {
  await requireAdmin();
  if (!hasDb) redirect("/admin/catalog");
}

/** Text from a pasted textarea or an uploaded file. */
async function textFrom(fd: FormData, field: string) {
  const f = fd.get(`${field}File`);
  if (f && typeof f === "object" && "text" in f && f.size > 0) {
    if (f.size > 5_000_000) throw new Error("That file is over 5 MB.");
    return f.text();
  }
  return s(fd, field);
}

function looksLikeCatalog(x: unknown): x is Catalog {
  const c = x as Catalog;
  return !!c && ["manufacturers", "features", "trims", "rules", "aftermarket", "sources"].every((k) => Array.isArray((c as unknown as Record<string, unknown>)[k]));
}

// ── draft lifecycle ──────────────────────────────────────

export async function startDraft() {
  await guard();
  await ensureDraft();
  go("/admin/catalog", { msg: "Draft started. Changes stay private until you publish." });
}

export async function discardDraftAction() {
  await guard();
  await discardDraft();
  go("/admin/catalog", { msg: "Draft discarded." });
}

export async function publishDraftAction(fd: FormData) {
  await guard();
  let version = "";
  try {
    version = await publishDraft(s(fd, "note"));
  } catch (e) {
    go("/admin/catalog", { error: (e as Error).message });
  }
  go("/admin/catalog", { msg: `Published ${version}. New listings now use it; saved listings keep their own version.` });
}

export async function rollbackAction(fd: FormData) {
  await guard();
  let version = "";
  try {
    version = await rollbackTo(s(fd, "id"));
  } catch (e) {
    go("/admin/catalog", { error: (e as Error).message });
  }
  go("/admin/catalog", { msg: `Rolled back: published ${version} as a copy of the older version.` });
}

// ── trims ────────────────────────────────────────────────

export async function saveTrim(fd: FormData) {
  await guard();
  const original = s(fd, "originalId");
  const back = `/admin/catalog/trims/${original || "new"}`;
  let trim: TrimRecord;
  try {
    const t = s(fd, "trim");
    trim = {
      id: s(fd, "id") || `${s(fd, "manufacturer")}-${t}`,
      manufacturer: s(fd, "manufacturer"),
      family: s(fd, "family"),
      familyLabel: s(fd, "familyLabel") || s(fd, "family"),
      trim: t,
      trimLabel: s(fd, "trimLabel") || t,
      years: parseYears(s(fd, "years")),
      engine: s(fd, "engine"),
      packages: parsePackages(s(fd, "packages")),
      market: list(s(fd, "market")),
      source: s(fd, "source"),
      status: status(s(fd, "status")),
    };
    if (!trim.manufacturer || !trim.family || !trim.trim) throw new Error("Manufacturer, family and trim key are required.");
    if (!/^[a-z0-9_]+$/.test(trim.family) || !/^[a-z0-9_]+$/.test(trim.trim)) throw new Error("Keys use lowercase letters, numbers and underscores only.");
    if (!trim.years.length) throw new Error("Add at least one year.");
    if (!trim.packages.length) throw new Error("Add at least one package.");
  } catch (e) {
    return go(back, { error: (e as Error).message });
  }
  const d = await ensureDraft();
  const trims = d.catalog.trims.filter((x) => x.id !== original && x.id !== trim.id);
  await saveDraft({ ...d.catalog, trims: [...trims, trim] });
  go("/admin/catalog/trims", { msg: `Saved ${trim.trimLabel} to the draft.` });
}

export async function deleteTrim(fd: FormData) {
  await guard();
  const d = await ensureDraft();
  await saveDraft({ ...d.catalog, trims: d.catalog.trims.filter((t) => t.id !== s(fd, "id")) });
  go("/admin/catalog/trims", { msg: "Deleted from the draft." });
}

// ── rules ────────────────────────────────────────────────

export async function saveRule(fd: FormData) {
  await guard();
  const original = s(fd, "originalId");
  const back = `/admin/catalog/rules/${original || "new"}`;
  let rule: Rule;
  try {
    const allow = s(fd, "allow") ? parseAllow(s(fd, "allow")) : [];
    const exclude = list(s(fd, "exclude"));
    rule = {
      id: s(fd, "id"),
      feature: s(fd, "feature"),
      when: conditionsFrom((k) => s(fd, k)),
      ...(allow.length ? { allow } : {}),
      ...(exclude.length ? { exclude } : {}),
      source: s(fd, "source"),
      status: status(s(fd, "status")),
      ...(s(fd, "note") ? { note: s(fd, "note") } : {}),
    };
    if (!rule.id || !/^[a-z0-9-_]+$/i.test(rule.id)) throw new Error("Give the rule an id (letters, numbers, - and _).");
    if (!allow.length && !exclude.length) throw new Error("A rule needs at least one allowed or excluded value.");
  } catch (e) {
    return go(back, { error: (e as Error).message });
  }
  const d = await ensureDraft();
  const rules = d.catalog.rules.filter((x) => x.id !== original && x.id !== rule.id);
  await saveDraft({ ...d.catalog, rules: [...rules, rule] });
  go("/admin/catalog/rules", { msg: `Saved rule ${rule.id} to the draft.`, feature: rule.feature });
}

export async function deleteRule(fd: FormData) {
  await guard();
  const d = await ensureDraft();
  await saveDraft({ ...d.catalog, rules: d.catalog.rules.filter((r) => r.id !== s(fd, "id")) });
  go("/admin/catalog/rules", { msg: "Deleted from the draft." });
}

// ── import & raw JSON ────────────────────────────────────

export async function importCsv(fd: FormData) {
  await guard();
  const kind = s(fd, "kind") === "rules" ? "rules" : "trims";
  let msg = "";
  try {
    const text = await textFrom(fd, "csv");
    if (!text) throw new Error("Paste CSV or choose a file.");
    const d = await ensureDraft();
    if (kind === "trims") {
      const r = upsert(d.catalog.trims, trimsFromCsv(text));
      await saveDraft({ ...d.catalog, trims: r.items });
      msg = `Imported trims: ${r.added} added, ${r.replaced} replaced.`;
    } else {
      const r = upsert(d.catalog.rules, rulesFromCsv(text));
      await saveDraft({ ...d.catalog, rules: r.items });
      msg = `Imported rules: ${r.added} added, ${r.replaced} replaced.`;
    }
  } catch (e) {
    go("/admin/catalog/import", { error: (e as Error).message });
  }
  go("/admin/catalog", { msg: `${msg} Check the problems list before publishing.` });
}

export async function importJson(fd: FormData) {
  await guard();
  let msg = "";
  try {
    const text = await textFrom(fd, "json");
    if (!text) throw new Error("Paste JSON or choose a file.");
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("That isn't valid JSON.");
    }
    const d = await ensureDraft();
    if (s(fd, "mode") === "replace") {
      if (!looksLikeCatalog(data)) throw new Error("A full catalog needs manufacturers, features, trims, rules, aftermarket and sources lists.");
      await saveDraft(data);
      msg = "Replaced the draft with the imported catalog.";
    } else {
      const part = data as Partial<Catalog>;
      const c = { ...d.catalog };
      const counts: string[] = [];
      for (const k of ["trims", "rules", "sources"] as const) {
        if (!Array.isArray(part[k])) continue;
        const r = upsert(c[k] as { id: string }[], part[k] as { id: string }[]);
        (c as Record<string, unknown>)[k] = r.items;
        counts.push(`${k}: ${r.added} added, ${r.replaced} replaced`);
      }
      for (const [k, key] of [["manufacturers", "key"], ["features", "key"], ["aftermarket", "value"]] as const) {
        if (!Array.isArray(part[k])) continue;
        const map = new Map((c[k] as unknown as Record<string, string>[]).map((x) => [x[key], x]));
        for (const x of part[k] as unknown as Record<string, string>[]) map.set(x[key], x);
        (c as Record<string, unknown>)[k] = [...map.values()];
        counts.push(`${k}: ${(part[k] as unknown[]).length} merged`);
      }
      if (!counts.length) throw new Error("Nothing to merge. Include trims, rules, sources, manufacturers, features or aftermarket lists.");
      await saveDraft(c);
      msg = `Merged ${counts.join("; ")}.`;
    }
  } catch (e) {
    go("/admin/catalog/import", { error: (e as Error).message });
  }
  go("/admin/catalog", { msg: `${msg} Check the problems list before publishing.` });
}

export async function saveRawJson(fd: FormData) {
  await guard();
  try {
    const data = JSON.parse(s(fd, "json"));
    if (!looksLikeCatalog(data)) throw new Error("The catalog needs manufacturers, features, trims, rules, aftermarket and sources lists.");
    await saveDraft(data);
  } catch (e) {
    go("/admin/catalog/import", { error: e instanceof SyntaxError ? "That isn't valid JSON." : (e as Error).message });
  }
  go("/admin/catalog", { msg: "Saved the draft JSON." });
}

