import { CATALOG, type Category, type VehicleModel, getModel } from "@/data/catalog";
import { between, hash, mulberry32, pick } from "./random";

export const CURRENT_YEAR = 2026;

export type DealRating = "great" | "good" | "fair" | "high" | "overpriced";

export const DEAL_RATINGS: { id: DealRating; label: string; maxRatio: number }[] = [
  { id: "great", label: "Great Deal", maxRatio: 0.9 },
  { id: "good", label: "Good Deal", maxRatio: 0.96 },
  { id: "fair", label: "Fair Deal", maxRatio: 1.04 },
  { id: "high", label: "High Price", maxRatio: 1.1 },
  { id: "overpriced", label: "Overpriced", maxRatio: Infinity },
];

export interface City {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  { name: "Boise", state: "ID", lat: 43.62, lon: -116.2 },
  { name: "Salt Lake City", state: "UT", lat: 40.76, lon: -111.89 },
  { name: "Denver", state: "CO", lat: 39.74, lon: -104.99 },
  { name: "Phoenix", state: "AZ", lat: 33.45, lon: -112.07 },
  { name: "Las Vegas", state: "NV", lat: 36.17, lon: -115.14 },
  { name: "Dallas", state: "TX", lat: 32.78, lon: -96.8 },
  { name: "Houston", state: "TX", lat: 29.76, lon: -95.37 },
  { name: "Minneapolis", state: "MN", lat: 44.98, lon: -93.27 },
  { name: "Duluth", state: "MN", lat: 46.79, lon: -92.1 },
  { name: "Green Bay", state: "WI", lat: 44.51, lon: -88.01 },
  { name: "Grand Rapids", state: "MI", lat: 42.96, lon: -85.67 },
  { name: "Marquette", state: "MI", lat: 46.55, lon: -87.4 },
  { name: "Fargo", state: "ND", lat: 46.88, lon: -96.79 },
  { name: "Billings", state: "MT", lat: 45.78, lon: -108.5 },
  { name: "Spokane", state: "WA", lat: 47.66, lon: -117.43 },
  { name: "Bend", state: "OR", lat: 44.06, lon: -121.31 },
  { name: "Nashville", state: "TN", lat: 36.16, lon: -86.78 },
  { name: "Atlanta", state: "GA", lat: 33.75, lon: -84.39 },
  { name: "Charlotte", state: "NC", lat: 35.23, lon: -80.84 },
  { name: "Burlington", state: "VT", lat: 44.48, lon: -73.21 },
  { name: "Bangor", state: "ME", lat: 44.8, lon: -68.77 },
  { name: "Columbus", state: "OH", lat: 39.96, lon: -83.0 },
];

const SNOW_STATES = new Set(["ID", "UT", "CO", "MN", "WI", "MI", "ND", "MT", "WA", "OR", "VT", "ME"]);

const DEALER_PREFIX = ["Summit", "Trailhead", "Northwoods", "Iron Horse", "Backcountry", "Rocky Ridge", "Big Sky", "Lakeside", "Redline", "Timberline"];
const DEALER_SUFFIX = ["Powersports", "Motorsports", "Outdoor", "Power & Sport", "Cycle & Sled"];
const COLORS = ["Black", "White", "Red", "Blue", "Gray", "Green", "Orange", "Camo", "Yellow"];
const FEATURE_POOL: Record<Category, string[]> = {
  atv: ["Winch", "Plow", "Heated grips", "Front & rear racks", "Upgraded tires", "Gun scabbard", "Windshield", "LED light bar", "Rear seat"],
  sxs: ["Full cab w/ heat", "Roof", "Doors", "Winch", "Stereo", "LED light bar", "Upgraded tires & wheels", "Clutch kit", "Spare belt", "Trailer included", "Harnesses"],
  snowmobile: ["Mountain bar", "Heated grips", "Tunnel bag", "Avalanche kit mount", "Studded track", "Ice scratchers", "GPS mount", "Cover", "Reverse"],
  motorcycle: ["Crash bars", "Panniers", "Skid plate", "Heated grips", "Windscreen", "Exhaust", "Steering damper", "Tank bag", "Comfort seat"],
};

export interface Listing {
  id: string;
  modelSlug: string;
  model: VehicleModel;
  year: number;
  condition: "new" | "used";
  price: number;
  marketValue: number;
  deal: DealRating;
  savings: number; // marketValue - price (positive = under market)
  usage: number;
  usageUnit: "hrs" | "mi";
  city: City;
  seller: string;
  sellerType: "dealer" | "private";
  daysOnMarket: number;
  priceDrop: number;
  color: string;
  features: string[];
  titleStatus: "Clean" | "Rebuilt";
  oneOwner: boolean;
  history: { daysAgo: number; price: number }[];
}

export function usageUnit(c: Category): "hrs" | "mi" {
  return c === "atv" || c === "sxs" ? "hrs" : "mi";
}

function expectedUsagePerYear(c: Category) {
  return { atv: 70, sxs: 90, snowmobile: 1200, motorcycle: 3500 }[c];
}

/** Estimated fair market value for a given model, year and usage. */
export function estimateMarketValue(m: VehicleModel, year: number, usage: number, condition: "new" | "used") {
  const age = CURRENT_YEAR - year;
  const msrpThatYear = m.msrp * Math.pow(0.975, age);
  if (condition === "new") return Math.round(msrpThatYear * (age === 0 ? 1.0 : 0.94));
  const base = msrpThatYear * 0.88 * Math.pow(1 - m.depreciation, Math.max(age, 0));
  const expected = expectedUsagePerYear(m.category) * Math.max(age, 0.5);
  const usageAdj = Math.min(1.08, Math.max(0.82, 1 - 0.14 * (usage / expected - 1)));
  return Math.round((base * usageAdj) / 50) * 50;
}

export function rateDeal(price: number, market: number): DealRating {
  const r = price / market;
  return DEAL_RATINGS.find((d) => r <= d.maxRatio)!.id;
}

function generateForModel(m: VehicleModel): Listing[] {
  const rand = mulberry32(hash(m.slug));
  const count = 7 + Math.floor(rand() * 8);
  const cities = m.category === "snowmobile" ? CITIES.filter((c) => SNOW_STATES.has(c.state)) : CITIES;
  const out: Listing[] = [];
  for (let i = 0; i < count; i++) {
    const isNew = rand() < 0.28;
    const year = isNew
      ? Math.max(m.years[0], CURRENT_YEAR - (rand() < 0.75 ? 0 : 1))
      : Math.round(between(rand, m.years[0], Math.min(m.years[1], CURRENT_YEAR - 1)));
    const age = CURRENT_YEAR - year;
    const unit = usageUnit(m.category);
    const usage = isNew
      ? Math.floor(rand() * (unit === "hrs" ? 3 : 15))
      : Math.round(expectedUsagePerYear(m.category) * Math.max(age, 0.5) * between(rand, 0.35, 1.8) / (unit === "hrs" ? 1 : 10)) * (unit === "hrs" ? 1 : 10);
    const market = estimateMarketValue(m, year, usage, isNew ? "new" : "used");
    const skew = isNew ? between(rand, 0.86, 1.08) : between(rand, 0.82, 1.2);
    const price = Math.round((market * skew) / 100) * 100 - (rand() < 0.5 ? 1 : 0);
    const sellerType = isNew || rand() < 0.62 ? "dealer" : "private";
    const priceDrop = rand() < 0.3 ? Math.round(between(rand, 200, 1800) / 50) * 50 : 0;
    const daysOnMarket = Math.floor(between(rand, 1, 95));
    const features = FEATURE_POOL[m.category].filter(() => rand() < (isNew ? 0.12 : 0.35));
    out.push({
      id: `${m.slug}-${i + 1}`,
      modelSlug: m.slug,
      model: m,
      year,
      condition: isNew ? "new" : "used",
      price,
      marketValue: market,
      deal: rateDeal(price, market),
      savings: market - price,
      usage,
      usageUnit: unit,
      city: pick(rand, cities),
      seller: sellerType === "dealer" ? `${pick(rand, DEALER_PREFIX)} ${pick(rand, DEALER_SUFFIX)}` : "Private seller",
      sellerType,
      daysOnMarket,
      priceDrop,
      color: pick(rand, COLORS),
      features,
      titleStatus: !isNew && rand() < 0.05 ? "Rebuilt" : "Clean",
      oneOwner: isNew || rand() < 0.55,
      history: priceDrop
        ? [
            { daysAgo: daysOnMarket, price: price + priceDrop },
            { daysAgo: Math.floor(daysOnMarket / 2), price },
          ]
        : [{ daysAgo: daysOnMarket, price }],
    });
  }
  return out;
}

let cache: Listing[] | null = null;
export function allListings(): Listing[] {
  if (!cache) cache = CATALOG.flatMap(generateForModel);
  return cache;
}

export function getListing(id: string) {
  return allListings().find((l) => l.id === id);
}

export function distanceMiles(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 3959;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export interface ListingFilters {
  q?: string;
  category?: string;
  make?: string[];
  model?: string;
  condition?: string;
  deal?: string[];
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxUsage?: number;
  near?: string;
  radius?: number;
  seller?: string;
  sort?: string;
}

const DEAL_ORDER: Record<DealRating, number> = { great: 0, good: 1, fair: 2, high: 3, overpriced: 4 };

export function filterListings(f: ListingFilters) {
  const origin = f.near ? CITIES.find((c) => c.name === f.near) : undefined;
  const q = f.q?.trim().toLowerCase();
  let rows = allListings()
    .map((l) => ({ ...l, distance: origin ? distanceMiles(origin, l.city) : undefined }))
    .filter((l) => {
      if (q && !`${l.year} ${l.model.make} ${l.model.model} ${l.model.segment}`.toLowerCase().includes(q)) return false;
      if (f.category && l.model.category !== f.category) return false;
      if (f.make?.length && !f.make.includes(l.model.make)) return false;
      if (f.model && l.modelSlug !== f.model) return false;
      if (f.condition && l.condition !== f.condition) return false;
      if (f.deal?.length && !f.deal.includes(l.deal)) return false;
      if (f.minPrice && l.price < f.minPrice) return false;
      if (f.maxPrice && l.price > f.maxPrice) return false;
      if (f.minYear && l.year < f.minYear) return false;
      if (f.maxYear && l.year > f.maxYear) return false;
      if (f.maxUsage && l.usage > f.maxUsage) return false;
      if (f.seller && l.sellerType !== f.seller) return false;
      if (origin && f.radius && (l.distance ?? 0) > f.radius) return false;
      return true;
    });
  const sorters: Record<string, (a: (typeof rows)[0], b: (typeof rows)[0]) => number> = {
    best: (a, b) => DEAL_ORDER[a.deal] - DEAL_ORDER[b.deal] || b.savings - a.savings,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "year-desc": (a, b) => b.year - a.year,
    "usage-asc": (a, b) => a.usage - b.usage,
    newest: (a, b) => a.daysOnMarket - b.daysOnMarket,
    closest: (a, b) => (a.distance ?? 0) - (b.distance ?? 0),
  };
  rows = rows.sort(sorters[f.sort ?? "best"] ?? sorters.best);
  return rows;
}

export function marketStats(slug: string) {
  const ls = allListings().filter((l) => l.modelSlug === slug);
  const used = ls.filter((l) => l.condition === "used");
  const prices = used.map((l) => l.price).sort((a, b) => a - b);
  const avg = prices.length ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : 0;
  return {
    count: ls.length,
    usedCount: used.length,
    low: prices[0] ?? 0,
    high: prices[prices.length - 1] ?? 0,
    avg,
    greatDeals: ls.filter((l) => l.deal === "great" || l.deal === "good").length,
  };
}

export { getModel };
