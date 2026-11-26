import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { snowmobileCatalog as seed } from "./catalog";
import { affectedListings, checkCatalog, nextVersionName, parseCsv, parseYears, rulesFromCsv, trimsFromCsv, upsert } from "./catalog-tools";
import { optionsFor } from "./engine";
import type { Catalog } from "./types";

const clone = (): Catalog => JSON.parse(JSON.stringify(seed));

describe("catalog integrity", () => {
  it("the seed catalog has no problems", () => {
    assert.deepEqual(checkCatalog(seed), []);
  });

  it("catches broken references and duplicates", () => {
    const c = clone();
    c.rules.push({ id: "bad", feature: "gauge_display", when: { trim: ["nope"] }, allow: [{ value: "hologram", origin: "factory_option" }], source: "missing", status: "seed_unverified" });
    c.trims.push({ ...c.trims[0] });
    const problems = checkCatalog(c).join("\n");
    assert.match(problems, /no trim "nope"/);
    assert.match(problems, /"hologram" isn't a Gauge \/ display value/);
    assert.match(problems, /unknown source "missing"/);
    assert.match(problems, /Duplicate trim id/);
    assert.match(problems, /already defined by/);
  });
});

describe("parsing", () => {
  it("reads years and ranges", () => {
    assert.deepEqual(parseYears("2021-2023, 2025"), [2021, 2022, 2023, 2025]);
    assert.throws(() => parseYears("twenty"));
  });

  it("handles quoted CSV fields", () => {
    const rows = parseCsv('a,b,c\n1,"x, y","say ""hi"""\n\n2,,3\n');
    assert.deepEqual(rows, [{ a: "1", b: "x, y", c: 'say "hi"' }, { a: "2", b: "", c: "3" }]);
  });

  it("imports trims from CSV", () => {
    const [t] = trimsFromCsv(
      'manufacturer,family,family_label,trim,trim_label,years,engine,packages,market,source,status\nski_doo,summit,Summit,summit_neo,Summit Neo,2024-2025,600 EFI,"137:137 in track",CA,seed-2026-11,seed_unverified\n',
    );
    assert.equal(t.id, "ski_doo-summit_neo");
    assert.deepEqual(t.years, [2024, 2025]);
    assert.deepEqual(t.packages, [{ key: "137", label: "137 in track" }]);
  });

  it("imports rules from CSV, including exclusions", () => {
    const [r] = rulesFromCsv(
      'id,feature,years,year_range,manufacturer,family,trim,package,market,allow,exclude,source,status,note\nneo-gauge,gauge_display,,2024-2025,ski_doo,summit,summit_neo,,,"basic_lcd:factory_standard",large_touchscreen_display,seed-2026-11,seed_unverified,Neo is basic\n',
    );
    assert.deepEqual(r.when, { yearRange: [2024, 2025], manufacturer: ["ski_doo"], family: ["summit"], trim: ["summit_neo"] });
    assert.deepEqual(r.allow, [{ value: "basic_lcd", origin: "factory_standard" }]);
    assert.deepEqual(r.exclude, ["large_touchscreen_display"]);
  });

  it("names the bad CSV row", () => {
    assert.throws(() => rulesFromCsv("id,feature,allow\nx,gauge_display,basic_lcd:magic\n"), /Row 2: Unknown origin "magic"/);
  });

  it("upserts by id", () => {
    const r = upsert([{ id: "a", v: 1 }, { id: "b", v: 1 }], [{ id: "b", v: 2 }, { id: "c", v: 1 }]);
    assert.deepEqual([r.added, r.replaced], [1, 1]);
    assert.equal(r.items.find((x) => x.id === "b")!.v, 2);
  });

  it("an imported trim and rule flow straight into the form choices", () => {
    const c = clone();
    c.trims = upsert(c.trims, trimsFromCsv("manufacturer,family,family_label,trim,trim_label,years,engine,packages,market,source,status\nski_doo,summit,Summit,summit_neo,Summit Neo,2024,600 EFI,137,CA,seed-2026-11,seed_unverified\n")).items;
    assert.deepEqual(checkCatalog(c), []);
    const r = optionsFor(c, { year: 2024, manufacturer: "ski_doo", family: "summit", trim: "summit_neo", package: "137" });
    // The family-wide Summit gauge rule applies to the new trim until a trim rule says otherwise.
    assert.deepEqual(r.features.find((f) => f.key === "gauge_display")!.options.map((o) => o.value), ["digital_color_display", "large_touchscreen_display"]);
  });
});

describe("affected listings", () => {
  const listing = {
    id: "L1",
    title: "2023 Ski-Doo Summit X 850 E-TEC",
    year: 2023,
    manufacturer: "ski_doo",
    family: "summit",
    trim: "summit_x_850",
    package: "154",
    equipment: [{ feature: "gauge_display", value: "large_touchscreen_display", origin: "factory_option" }],
  };

  it("reports nothing when the change doesn't touch the listing", () => {
    const c = clone();
    c.rules.find((r) => r.id === "pol-rmk-gauge")!.allow!.push({ value: "gps_navigation_display", origin: "dealer_accessory" });
    assert.deepEqual(affectedListings(seed, c, [listing]), []);
  });

  it("flags listings whose saved factory equipment would become invalid", () => {
    const c = clone();
    c.rules.push({ id: "x-no-touch", feature: "gauge_display", when: { manufacturer: ["ski_doo"], family: ["summit"], trim: ["summit_x_850"] }, exclude: ["large_touchscreen_display"], source: "seed-2026-11", status: "admin_verified" });
    const [impact] = affectedListings(seed, c, [listing]);
    assert.equal(impact.id, "L1");
    assert.match(impact.reasons.join(" "), /Gauge \/ display choices change/);
    assert.match(impact.reasons.join(" "), /no longer be valid factory equipment/);
  });

  it("flags listings whose trim disappears", () => {
    const c = clone();
    c.trims = c.trims.filter((t) => t.trim !== "summit_x_850");
    assert.match(affectedListings(seed, c, [listing])[0].reasons[0], /trim, package is no longer in the catalog/);
  });
});

it("names versions by day with a counter", () => {
  const d = new Date("2026-11-26T12:00:00Z");
  assert.equal(nextVersionName([], d), "2026.11.26-1");
  assert.equal(nextVersionName(["2026.11.26-1"], d), "2026.11.26-2");
});
