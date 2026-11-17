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
  province: string;
  lat: number;
  lon: number;
}

/** Roost is Canada only. */
export const CITIES: City[] = [
  { name: "Vancouver", province: "BC", lat: 49.28, lon: -123.12 },
  { name: "Kamloops", province: "BC", lat: 50.67, lon: -120.33 },
  { name: "Kelowna", province: "BC", lat: 49.89, lon: -119.5 },
  { name: "Prince George", province: "BC", lat: 53.92, lon: -122.75 },
  { name: "Calgary", province: "AB", lat: 51.05, lon: -114.07 },
  { name: "Red Deer", province: "AB", lat: 52.27, lon: -113.81 },
  { name: "Edmonton", province: "AB", lat: 53.55, lon: -113.49 },
  { name: "Grande Prairie", province: "AB", lat: 55.17, lon: -118.8 },
  { name: "Saskatoon", province: "SK", lat: 52.13, lon: -106.67 },
  { name: "Regina", province: "SK", lat: 50.45, lon: -104.61 },
  { name: "Winnipeg", province: "MB", lat: 49.9, lon: -97.14 },
  { name: "Thunder Bay", province: "ON", lat: 48.38, lon: -89.25 },
  { name: "Sudbury", province: "ON", lat: 46.49, lon: -80.99 },
  { name: "Barrie", province: "ON", lat: 44.39, lon: -79.69 },
  { name: "London", province: "ON", lat: 42.98, lon: -81.25 },
  { name: "Ottawa", province: "ON", lat: 45.42, lon: -75.7 },
  { name: "Montréal", province: "QC", lat: 45.5, lon: -73.57 },
  { name: "Québec City", province: "QC", lat: 46.81, lon: -71.21 },
  { name: "Saguenay", province: "QC", lat: 48.43, lon: -71.07 },
  { name: "Moncton", province: "NB", lat: 46.09, lon: -64.78 },
  { name: "Halifax", province: "NS", lat: 44.65, lon: -63.58 },
  { name: "St. John's", province: "NL", lat: 47.56, lon: -52.71 },
  { name: "Whitehorse", province: "YT", lat: 60.72, lon: -135.06 },
];

/** Places with too little reliable snow to stock many sleds. */
const LOW_SNOW_CITIES = new Set(["Vancouver"]);

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
  usageUnit: "hrs" | "km";
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

export function usageUnit(c: Category): "hrs" | "km" {
  return c === "atv" || c === "sxs" ? "hrs" : "km";
}

export function expectedUsagePerYear(c: Category) {
  return { atv: 70, sxs: 90, snowmobile: 2000, motorcycle: 5600 }[c]; // hours or km
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
  const cities = m.category === "snowmobile" ? CITIES.filter((c) => !LOW_SNOW_CITIES.has(c.name)) : CITIES;
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

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
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
  /** Only listings that have dropped their price. */
  drop?: boolean;
  /** Listed at least this many days (older listings = more room to negotiate). */
  minDays?: number;
  /** Listed at most this many days. */
  maxDays?: number;
  sort?: string;
}

const DEAL_ORDER: Record<DealRating, number> = { great: 0, good: 1, fair: 2, high: 3, overpriced: 4 };

export function filterListings(f: ListingFilters) {
  const origin = f.near ? CITIES.find((c) => c.name === f.near) : undefined;
  const q = f.q?.trim().toLowerCase();
  let rows = allListings()
    .map((l) => ({ ...l, distance: origin ? distanceKm(origin, l.city) : undefined }))
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
      if (f.drop && l.priceDrop <= 0) return false;
      if (f.minDays && l.daysOnMarket < f.minDays) return false;
      if (f.maxDays && l.daysOnMarket > f.maxDays) return false;
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
    "dom-desc": (a, b) => b.daysOnMarket - a.daysOnMarket,
    "drop-desc": (a, b) => b.priceDrop - a.priceDrop || b.daysOnMarket - a.daysOnMarket,
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

/** Days since the most recent price drop, if there was one. */
export function lastDropDaysAgo(l: Listing) {
  return l.history.length > 1 ? l.history[l.history.length - 1].daysAgo : undefined;
}

export const JUST_LISTED_DAYS = 3;
export const STALE_DAYS = 60;

export type MarketTimeLevel = "fresh" | "typical" | "long";

/**
 * How long this listing has been up compared with others of the same type,
 * and what that means for a buyer.
 */
export function timeOnMarket(l: Listing) {
  const peers = allListings().filter((x) => x.model.category === l.model.category);
  const days = peers.map((x) => x.daysOnMarket).sort((a, b) => a - b);
  const median = days[Math.floor(days.length / 2)];
  const longerThanPct = Math.round((peers.filter((x) => x.daysOnMarket < l.daysOnMarket).length / peers.length) * 100);
  const level: MarketTimeLevel =
    l.daysOnMarket <= 7 ? "fresh" : l.daysOnMarket >= STALE_DAYS || longerThanPct >= 75 ? "long" : "typical";
  return { days: l.daysOnMarket, median, longerThanPct, level };
}

export { getModel };
