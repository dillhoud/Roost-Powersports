import type { Category } from "./catalog";

export type PromoType =
  | "rebate"
  | "financing"
  | "pro"
  | "military"
  | "first-responder"
  | "ag"
  | "loyalty"
  | "racer";

export const PROMO_TYPES: { id: PromoType; label: string; description: string }[] = [
  { id: "rebate", label: "Cash rebate", description: "Money off the purchase price" },
  { id: "financing", label: "Low-APR financing", description: "Promotional financing rates" },
  { id: "pro", label: "Pro / industry", description: "Programs for industry pros, guides, outfitters & businesses" },
  { id: "military", label: "Military", description: "Active duty, veterans & their families" },
  { id: "first-responder", label: "First responder", description: "Police, fire, EMS & medical" },
  { id: "ag", label: "Farm & ag", description: "Farm Bureau and agricultural programs" },
  { id: "loyalty", label: "Owner loyalty", description: "For current owners trading up" },
  { id: "racer", label: "Racer / contingency", description: "Rewards for racing results on the brand" },
];

export interface Promo {
  id: string;
  make: string;
  type: PromoType;
  title: string;
  amount: string;
  /** Rough dollar value used for sorting. */
  value: number;
  categories: Category[];
  models?: string; // free text, e.g. "Select 2025–2026 RZR"
  eligibility: string;
  ends: string; // ISO date
  verifyUrl: string;
}

const BRAND_SITES: Record<string, string> = {
  Polaris: "https://www.polaris.com",
  "Can-Am": "https://can-am.brp.com",
  "Ski-Doo": "https://www.ski-doo.com",
  Honda: "https://powersports.honda.com",
  Yamaha: "https://www.yamahamotorsports.com",
  Kawasaki: "https://www.kawasaki.com",
  CFMOTO: "https://cfmotousa.com",
  "Arctic Cat": "https://arcticcat.com",
  KTM: "https://www.ktm.com",
};

type RawPromo = Omit<Promo, "id" | "verifyUrl">;

const RAW: RawPromo[] = [
  { make: "Polaris", type: "rebate", title: "Fall Sales Event — RZR", amount: "Up to $2,000 off", value: 2000, categories: ["sxs"], models: "Select 2025–2026 RZR", eligibility: "Retail customers, in-stock units", ends: "2026-10-31" },
  { make: "Polaris", type: "financing", title: "Sportsman promo financing", amount: "As low as 1.99% APR / 36 mo", value: 900, categories: ["atv"], models: "Select Sportsman", eligibility: "Approved credit", ends: "2026-11-30" },
  { make: "Polaris", type: "military", title: "Military & first responder offer", amount: "Extra $500 off", value: 500, categories: ["atv", "sxs", "snowmobile"], eligibility: "Active, retired & veteran military; police, fire, EMS. ID verification required.", ends: "2026-12-31" },
  { make: "Polaris", type: "ag", title: "Farm Bureau member discount", amount: "$300–$500 off", value: 400, categories: ["atv", "sxs"], models: "Ranger & Sportsman", eligibility: "Participating state Farm Bureau members", ends: "2026-12-31" },
  { make: "Polaris", type: "pro", title: "Commercial / fleet program", amount: "Volume pricing", value: 1500, categories: ["atv", "sxs"], models: "Ranger, PRO XD", eligibility: "Businesses, outfitters & fleet buyers", ends: "2026-12-31" },
  { make: "Can-Am", type: "rebate", title: "Maverick X3 savings", amount: "Up to $2,500 rebate", value: 2500, categories: ["sxs"], models: "Select 2025 Maverick X3", eligibility: "Retail, while supplies last", ends: "2026-10-31" },
  { make: "Can-Am", type: "financing", title: "Outlander promo APR", amount: "As low as 2.99% / 60 mo", value: 800, categories: ["atv"], eligibility: "Approved credit", ends: "2026-11-15" },
  { make: "Can-Am", type: "military", title: "Military & first responder rebate", amount: "$500 off", value: 500, categories: ["atv", "sxs"], eligibility: "Verified military, police, fire & EMS", ends: "2026-12-31" },
  { make: "Can-Am", type: "racer", title: "Contingency program", amount: "Cash per podium", value: 300, categories: ["sxs", "atv"], eligibility: "Racers in sanctioned series on Can-Am units", ends: "2026-12-31" },
  { make: "Ski-Doo", type: "rebate", title: "Spring Fever / Snowcheck carryover", amount: "Up to $1,500 + extended warranty", value: 1500, categories: ["snowmobile"], models: "Select 2025–2026 Summit & Renegade", eligibility: "Retail customers", ends: "2026-12-31" },
  { make: "Ski-Doo", type: "pro", title: "Guides & outfitters program", amount: "Special pricing", value: 1200, categories: ["snowmobile"], eligibility: "Licensed guides, outfitters & rental operators", ends: "2026-12-31" },
  { make: "Honda", type: "financing", title: "Honda Powersports financing", amount: "As low as 3.49% APR", value: 700, categories: ["atv", "sxs", "motorcycle"], eligibility: "Approved credit via Honda Financial", ends: "2026-12-01" },
  { make: "Honda", type: "rebate", title: "Pioneer bonus bucks", amount: "Up to $1,000", value: 1000, categories: ["sxs"], models: "Select Pioneer 700/1000", eligibility: "Retail", ends: "2026-10-31" },
  { make: "Honda", type: "racer", title: "Red Rider contingency", amount: "Payouts by class & series", value: 400, categories: ["motorcycle"], models: "CRF-R", eligibility: "Amateur & pro racers on eligible CRFs", ends: "2026-12-31" },
  { make: "Yamaha", type: "rebate", title: "Customer cash", amount: "Up to $1,250", value: 1250, categories: ["atv", "sxs"], models: "Select Grizzly, Kodiak & YXZ", eligibility: "Retail", ends: "2026-11-01" },
  { make: "Yamaha", type: "military", title: "Military appreciation", amount: "$300–$500 off", value: 400, categories: ["atv", "sxs", "motorcycle", "snowmobile"], eligibility: "Verified active & veteran service members", ends: "2026-12-31" },
  { make: "Yamaha", type: "racer", title: "bLU cRU contingency", amount: "Payouts by class & series", value: 400, categories: ["motorcycle", "atv", "sxs"], eligibility: "Registered bLU cRU racers", ends: "2026-12-31" },
  { make: "Kawasaki", type: "rebate", title: "Good Times sales event", amount: "Up to $1,000", value: 1000, categories: ["atv", "sxs", "motorcycle"], models: "Select Brute Force, Teryx & Ninja", eligibility: "Retail", ends: "2026-10-31" },
  { make: "Kawasaki", type: "first-responder", title: "Heroes program", amount: "$300 off", value: 300, categories: ["atv", "sxs", "motorcycle"], eligibility: "Military, police, fire, EMS & medical", ends: "2026-12-31" },
  { make: "CFMOTO", type: "financing", title: "0% APR event", amount: "0% APR / 36 mo", value: 1200, categories: ["atv", "sxs"], eligibility: "Approved credit", ends: "2026-11-30" },
  { make: "CFMOTO", type: "loyalty", title: "Conquest / trade-in bonus", amount: "$500 bonus", value: 500, categories: ["atv", "sxs"], eligibility: "Owners of competitive brands trading in", ends: "2026-12-31" },
  { make: "Arctic Cat", type: "rebate", title: "Snow season savings", amount: "Up to $1,200", value: 1200, categories: ["snowmobile"], models: "Select Catalyst & Riot", eligibility: "Retail", ends: "2026-12-15" },
  { make: "Arctic Cat", type: "military", title: "Military & first responder", amount: "$300 off", value: 300, categories: ["snowmobile", "atv", "sxs"], eligibility: "Verified military & first responders", ends: "2026-12-31" },
  { make: "KTM", type: "financing", title: "KTM promo financing", amount: "As low as 3.99% APR", value: 600, categories: ["motorcycle"], models: "Select Adventure & EXC/XC-W", eligibility: "Approved credit", ends: "2026-11-30" },
  { make: "KTM", type: "racer", title: "Race support / contingency", amount: "Payouts by series", value: 400, categories: ["motorcycle"], eligibility: "Registered racers", ends: "2026-12-31" },
];

export const PROMOS: Promo[] = RAW.map((p, i) => ({
  ...p,
  id: `promo-${i}`,
  verifyUrl: BRAND_SITES[p.make] ?? "#",
}));

export function promosForMake(make: string) {
  return PROMOS.filter((p) => p.make === make);
}

export function promoTypeLabel(t: PromoType) {
  return PROMO_TYPES.find((x) => x.id === t)?.label ?? t;
}
