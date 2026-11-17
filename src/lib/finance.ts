import type { Promo } from "@/data/promos";
import type { Category } from "@/data/catalog";

/** Typical powersports loan rates by credit tier (illustrative, not quotes). */
export const CREDIT_TIERS = [
  { id: "excellent", label: "Excellent (720+)", apr: 7.49 },
  { id: "good", label: "Good (680–719)", apr: 9.99 },
  { id: "fair", label: "Fair (620–679)", apr: 13.99 },
  { id: "rebuilding", label: "Rebuilding (<620)", apr: 18.99 },
] as const;

export const TERMS = [24, 36, 48, 60, 72] as const;

export const DEFAULT_DOWN_PCT = 0.2;
export const DEFAULT_TERM = 60;
export const DEFAULT_APR = CREDIT_TIERS[1].apr;

/** Standard amortized monthly payment. */
export function monthlyPayment(principal: number, aprPct: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const r = aprPct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

/** Rough monthly payment shown on listing cards: 20% down, 60 months, good credit. */
export function estPayment(price: number) {
  return Math.round(monthlyPayment(price * (1 - DEFAULT_DOWN_PCT), DEFAULT_APR, DEFAULT_TERM));
}

export interface PromoRate {
  title: string;
  make: string;
  apr: number;
  /** Max term in months, if the offer states one. */
  months?: number;
  ends: string;
}

/** Pull an APR (and term) out of offer text such as "As low as 1.99% APR / 36 mo". */
export function parsePromoRate(p: Promo): PromoRate | null {
  if (p.type !== "financing") return null;
  const apr = p.amount.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!apr) return null;
  const months = p.amount.match(/(\d+)\s*mo/i);
  return { title: p.title, make: p.make, apr: Number(apr[1]), months: months ? Number(months[1]) : undefined, ends: p.ends };
}

/** The best promo financing rate for a make and category, if any. */
export function bestPromoRate(promos: Promo[], make: string, category: Category) {
  return promos
    .filter((p) => p.make === make && p.categories.includes(category))
    .map(parsePromoRate)
    .filter((r): r is PromoRate => r !== null)
    .sort((a, b) => a.apr - b.apr)[0];
}

/**
 * Combined sales tax (GST + PST, or HST) by province or territory, in percent.
 * Rates change. Check the Canada Revenue Agency and provincial sites before relying on them.
 */
export const SALES_TAX: Record<string, { pct: number; label: string }> = {
  AB: { pct: 5, label: "GST" },
  BC: { pct: 12, label: "GST + PST" },
  SK: { pct: 11, label: "GST + PST" },
  MB: { pct: 12, label: "GST + RST" },
  ON: { pct: 13, label: "HST" },
  QC: { pct: 14.975, label: "GST + QST" },
  NB: { pct: 15, label: "HST" },
  NS: { pct: 14, label: "HST" },
  PE: { pct: 15, label: "HST" },
  NL: { pct: 15, label: "HST" },
  YT: { pct: 5, label: "GST" },
  NT: { pct: 5, label: "GST" },
  NU: { pct: 5, label: "GST" },
};

export function salesTaxFor(province: string) {
  return SALES_TAX[province] ?? { pct: 13, label: "Sales tax" };
}
