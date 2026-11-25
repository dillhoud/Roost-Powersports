import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { snowmobileCatalog as c } from "./catalog";
import { OTHER_MANUFACTURER, optionsFor, validateConfig, type ListingConfigInput } from "./engine";
import { AFTERMARKET, UNKNOWN, type Catalog } from "./types";

const values = (key: string, sel: Parameters<typeof optionsFor>[1]) =>
  optionsFor(c, sel).features.find((f) => f.key === key)?.options.map((o) => o.value) ?? [];
const originOf = (key: string, value: string, sel: Parameters<typeof optionsFor>[1]) =>
  optionsFor(c, sel).features.find((f) => f.key === key)?.options.find((o) => o.value === value)?.origin;

const summitX154 = { year: 2023, manufacturer: "ski_doo", family: "summit", trim: "summit_x_850", package: "154" };
const summitSp146 = { year: 2023, manufacturer: "ski_doo", family: "summit", trim: "summit_sp_600r", package: "146" };

describe("cascading choices", () => {
  it("only offers manufacturers with catalog data for the year, plus Other", () => {
    const r = optionsFor(c, { year: 2023 });
    assert.deepEqual(r.manufacturers.map((m) => m.key).sort(), ["arctic_cat", "polaris", "ski_doo", OTHER_MANUFACTURER].sort());
  });

  it("only offers families and trims sold that year", () => {
    assert.deepEqual(optionsFor(c, { year: 2024, manufacturer: "arctic_cat" }).families.map((f) => f.key).sort(), ["mountain_cat", "riot"]);
    const trims2024 = optionsFor(c, { year: 2024, manufacturer: "arctic_cat", family: "mountain_cat" }).trims.map((t) => t.key);
    assert.ok(!trims2024.includes("m8000_hardcore_alpha"), "Hardcore was only seeded for 2023");
  });

  it("only offers the trim's own packages", () => {
    const r = optionsFor(c, { year: 2023, manufacturer: "ski_doo", family: "summit", trim: "summit_x_expert_850" });
    assert.deepEqual(r.packages.map((p) => p.key), ["154", "165", "175"]);
    assert.equal(r.stage, "package");
  });

  it("clears choices that stop fitting when an earlier choice changes", () => {
    const r = optionsFor(c, { year: 2024, manufacturer: "arctic_cat", family: "mountain_cat", trim: "m8000_hardcore_alpha", package: "154" });
    assert.deepEqual(r.cleared, ["trim", "package"]);
    assert.equal(r.selection.trim, undefined);
    const r2 = optionsFor(c, { year: 2023, manufacturer: "polaris", family: "summit" });
    assert.deepEqual(r2.cleared, ["family"]);
  });

  it("asks for the exact package before showing equipment", () => {
    const r = optionsFor(c, { year: 2023, manufacturer: "ski_doo", family: "summit" });
    assert.equal(r.features.length, 0);
    assert.match(r.messages.join(" "), /exact model and package/);
  });
});

describe("factory equipment filtering", () => {
  it("gives each trim only its own gauge choices", () => {
    assert.deepEqual(values("gauge_display", summitX154), ["digital_color_display", "large_touchscreen_display"]);
    assert.deepEqual(values("gauge_display", summitSp146), ["basic_lcd"]);
  });

  it("lets a specific exclusion override a broad family rule", () => {
    assert.ok(!values("gauge_display", summitSp146).includes("large_touchscreen_display"));
    const hardcore = { year: 2023, manufacturer: "arctic_cat", family: "mountain_cat", trim: "m8000_hardcore_alpha", package: "154" };
    assert.deepEqual(values("gauge_display", hardcore), ["basic_lcd"]);
  });

  it("keeps factory options and dealer accessories apart", () => {
    assert.equal(originOf("gauge_display", "large_touchscreen_display", summitX154), "factory_option");
    const rmkSp = { year: 2023, manufacturer: "polaris", family: "rmk", trim: "rmk_sp_650", package: "146" };
    assert.equal(originOf("gauge_display", "large_touchscreen_display", rmkSp), "dealer_accessory");
  });

  it("applies package rules such as track length", () => {
    assert.deepEqual(values("lug_height", summitSp146), ["lug_2_5"]);
    assert.deepEqual(values("lug_height", { ...summitSp146, package: "154" }), ["lug_3_0"]);
  });

  it("marks everything as needing verification when the trim is unknown", () => {
    const r = optionsFor(c, { year: 2023, manufacturer: "ski_doo", family: "summit", trim: UNKNOWN });
    const gauges = r.features.find((f) => f.key === "gauge_display")!.options;
    assert.deepEqual(gauges.map((g) => g.value).sort(), ["basic_lcd", "digital_color_display", "large_touchscreen_display"]);
    assert.ok(gauges.every((g) => g.origin === "unknown" && g.status === "unknown"));
    assert.equal(r.summary.verification, "unverified");
  });

  it("never reports seed data as verified", () => {
    assert.equal(optionsFor(c, summitX154).summary.verification, "unverified");
  });
});

describe("server validation", () => {
  const base = (factory: ListingConfigInput["factory"], extra: Partial<ListingConfigInput> = {}): ListingConfigInput => ({
    selection: summitSp146,
    factory,
    aftermarket: [],
    ...extra,
  });

  it("rejects a gauge that isn't factory equipment for the trim", () => {
    const r = validateConfig(c, base({ gauge_display: "large_touchscreen_display" }));
    assert.equal(r.ok, false);
    assert.match(r.errors[0].message, /isn't listed as factory equipment for the Summit SP 600R E-TEC\. Add it under Aftermarket modifications/);
  });

  it("accepts the same display when it's marked as aftermarket", () => {
    const r = validateConfig(c, base({ gauge_display: AFTERMARKET }, { factoryAftermarket: { gauge_display: "large_touchscreen_display" } }));
    assert.equal(r.ok, true, JSON.stringify(r.errors));
    assert.deepEqual(r.equipment.find((e) => e.feature === "gauge_display"), {
      feature: "gauge_display",
      value: "large_touchscreen_display",
      origin: "aftermarket",
      catalog_status: "seller_reported",
    });
  });

  it("stores factory choices with their origin and source", () => {
    const r = validateConfig(c, base({ gauge_display: "large_touchscreen_display" }, { selection: summitX154 }));
    assert.equal(r.ok, true);
    const g = r.equipment.find((e) => e.feature === "gauge_display")!;
    assert.equal(g.origin, "factory_option");
    assert.equal(g.catalog_status, "seed_unverified");
    assert.equal(g.source_reference, "seed-2026-11");
  });

  it("records unanswered equipment as unknown rather than absent", () => {
    const r = validateConfig(c, base({}));
    assert.ok(r.equipment.every((e) => e.origin === "unknown"));
    assert.ok(r.equipment.some((e) => e.feature === "gauge_display"));
  });

  it("rejects a selection that was tampered with, e.g. a trim from another year", () => {
    const r = validateConfig(c, { selection: { year: 2024, manufacturer: "arctic_cat", family: "mountain_cat", trim: "m8000_hardcore_alpha", package: "154" }, factory: {}, aftermarket: [] });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.field === "trim"));
  });

  it("rejects features that don't apply and unknown modifications", () => {
    const r = validateConfig(c, base({ made_up: "x" }, { aftermarket: [{ key: "rocket" }, { key: "other" }] }));
    assert.equal(r.ok, false);
    assert.equal(r.errors.length, 3);
  });

  it("accepts a make that isn't in the catalog as seller-reported", () => {
    const r = validateConfig(c, { selection: { year: 2023, manufacturer: OTHER_MANUFACTURER }, factory: {}, aftermarket: [{ key: "other", note: "Vintage cowl" }] });
    assert.equal(r.ok, true, JSON.stringify(r.errors));
    assert.equal(r.verification, "unverified");
    assert.equal(r.identity.trimStatus, "seller_reported");
  });

  it("calls a configuration verified only when every fact is from a trusted source", () => {
    const verified: Catalog = JSON.parse(JSON.stringify(c));
    for (const t of verified.trims) t.status = "verified_manufacturer_source";
    for (const rule of verified.rules) rule.status = "admin_verified";
    const all = { gauge_display: "digital_color_display", lug_height: "lug_3_0", starter: "recoil", reverse: "electronic_reverse", shock_package: "kyb_pro", windshield: "no_windshield" };
    assert.equal(validateConfig(verified, { selection: summitX154, factory: all, aftermarket: [] }).verification, "verified");
    assert.equal(validateConfig(verified, { selection: summitX154, factory: { ...all, starter: UNKNOWN }, aftermarket: [] }).verification, "partially_verified");
  });
});
