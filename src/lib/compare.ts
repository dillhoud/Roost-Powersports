import { CATALOG, getModel, type VehicleModel } from "@/data/catalog";

export const MAX_COMPARE = 3;

/** Closest competitors: same type, same segment first, then nearest price, never the same brand first. */
export function rivals(m: VehicleModel, n = 2) {
  return CATALOG.filter((x) => x.category === m.category && x.slug !== m.slug)
    .sort(
      (a, b) =>
        Number(b.segment === m.segment) - Number(a.segment === m.segment) ||
        Number(a.make === m.make) - Number(b.make === m.make) ||
        Math.abs(a.msrp - m.msrp) - Math.abs(b.msrp - m.msrp),
    )
    .slice(0, n);
}

export function compareHref(slugs: string[]) {
  const sp = new URLSearchParams();
  for (const s of slugs.slice(0, MAX_COMPARE)) sp.append("m", s);
  return `/compare?${sp}`;
}

/** Valid, de-duplicated models from the query string, in order. */
export function parseCompare(raw: string[]) {
  const seen = new Set<string>();
  const out: VehicleModel[] = [];
  for (const s of raw) {
    const m = getModel(s);
    if (m && !seen.has(m.slug) && out.length < MAX_COMPARE) {
      seen.add(m.slug);
      out.push(m);
    }
  }
  return out;
}

/** A few ready-made matchups people commonly cross-shop. */
export function popularMatchups() {
  const picks = ["canam-maverick-x3", "polaris-sportsman-570", "skidoo-summit-x", "yamaha-tenere-700", "polaris-ranger-xp-1000"];
  return picks
    .map((s) => getModel(s))
    .filter((m): m is VehicleModel => !!m)
    .map((m) => [m, ...rivals(m, 2)]);
}
