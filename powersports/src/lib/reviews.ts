import { CATALOG, type UseCase, type VehicleModel, getModel } from "@/data/catalog";
import { issuesFor } from "@/data/issues";
import { CURRENT_YEAR, usageUnit } from "./listings";
import { between, hash, mulberry32, pick } from "./random";

export const EXPERIENCE = ["First-timer", "Intermediate", "Experienced", "Expert / Racer"] as const;
export type Experience = (typeof EXPERIENCE)[number];

export const SUB_RATINGS = ["reliability", "performance", "comfort", "value", "dealer"] as const;
export type SubRating = (typeof SUB_RATINGS)[number];
export const SUB_LABELS: Record<SubRating, string> = {
  reliability: "Reliability",
  performance: "Performance",
  comfort: "Comfort / ride",
  value: "Value",
  dealer: "Dealer & service",
};

export interface Review {
  id: string;
  modelSlug: string;
  model: VehicleModel;
  author: string;
  location: string;
  modelYear: number;
  ownedMonths: number;
  usage: number;
  usageUnit: "hrs" | "mi";
  useCase: UseCase;
  experience: Experience;
  verified: boolean;
  rating: number;
  sub: Record<SubRating, number>;
  title: string;
  body: string;
  pros: string;
  cons: string;
  recommend: boolean;
  helpful: number;
  daysAgo: number;
}

const FIRST = ["Jake", "Tyler", "Brandi", "Cody", "Marcus", "Jen", "Dustin", "Kayla", "Travis", "Hank", "Lena", "Brett", "Sam", "Rosa", "Wade", "Tori", "Dale", "Erin", "Colt", "Nate"];
const STATES = ["ID", "UT", "CO", "MN", "WI", "MI", "TX", "AZ", "MT", "WA", "TN", "PA", "ME", "OR", "NC", "OH"];

/** Each model's overall "quality" lean, derived from its issue severity. */
function baseScore(m: VehicleModel) {
  const issues = issuesFor(m.slug);
  const penalty = issues.reduce((s, i) => s + (i.severity === "major" ? 0.35 : i.severity === "moderate" ? 0.15 : 0.05), 0);
  return Math.max(3.4, Math.min(4.8, 4.75 - penalty));
}

const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n)));

function buildReview(m: VehicleModel, i: number, rand: () => number): Review {
  const base = baseScore(m);
  const mood = between(rand, -1.6, 0.8);
  const issues = issuesFor(m.slug).filter((i) => i.kind !== "recall");
  const hitIssue = issues.length && rand() < 0.45 ? pick(rand, issues) : undefined;
  const sub: Record<SubRating, number> = {
    reliability: clamp(base + mood + (hitIssue ? -1 : 0.3) + between(rand, -0.4, 0.4)),
    performance: clamp(base + mood + 0.3 + between(rand, -0.5, 0.5)),
    comfort: clamp(base + mood - 0.2 + between(rand, -0.6, 0.6)),
    value: clamp(base + mood + between(rand, -0.6, 0.6)),
    dealer: clamp(base + mood - 0.3 + between(rand, -1, 0.8)),
  };
  const rating = clamp((sub.reliability * 1.4 + sub.performance + sub.comfort + sub.value + sub.dealer * 0.6) / 5);
  const year = Math.round(between(rand, Math.max(m.years[0], CURRENT_YEAR - 8), CURRENT_YEAR));
  const ownedMonths = Math.max(1, Math.round(between(rand, 1, (CURRENT_YEAR - year + 1) * 12)));
  const unit = usageUnit(m.category);
  const usage = Math.round(((unit === "hrs" ? 7 : 300) * ownedMonths * between(rand, 0.4, 1.8)) / (unit === "hrs" ? 1 : 100)) * (unit === "hrs" ? 1 : 100);
  const useCase = pick(rand, m.useCases);
  const pro = pick(rand, m.pros);
  const con = pick(rand, m.cons);

  const openers =
    rating >= 4
      ? [`Couldn't be happier with my ${year} ${m.model}.`, `This thing has been a blast for ${useCase.toLowerCase()} riding.`, `Coming from another brand, the ${m.model} was a big upgrade.`]
      : rating === 3
        ? [`Mixed feelings on the ${m.model}.`, `Good machine, but it's not perfect.`, `It does the job, with a few caveats.`]
        : [`Honestly disappointed with my ${m.model}.`, `I wanted to love this machine.`, `Not the ownership experience I hoped for.`];
  const issueLine = hitIssue
    ? ` I did run into ${hitIssue.title.toLowerCase()} around ${usage.toLocaleString()} ${unit} — ${hitIssue.fix.charAt(0).toLowerCase() + hitIssue.fix.slice(1)}`
    : ` ${usage.toLocaleString()} ${unit} in and nothing beyond normal maintenance so far.`;
  const close =
    sub.dealer <= 2
      ? " The dealer experience was the weak point — slow service and parts waits."
      : sub.dealer >= 5
        ? " Dealer has been great with service and warranty."
        : "";
  const titles =
    rating >= 4
      ? [`Great for ${useCase.toLowerCase()}`, `${pro} — worth it`, "Would buy again", "Exceeded expectations"]
      : rating === 3
        ? ["Good, not great", `Watch out for: ${con.toLowerCase()}`, "Solid with some quirks"]
        : ["Frustrating ownership", hitIssue ? hitIssue.title : "Expected more", "Think twice"];

  return {
    id: `${m.slug}-r${i}`,
    modelSlug: m.slug,
    model: m,
    author: `${pick(rand, FIRST)} ${String.fromCharCode(65 + Math.floor(rand() * 26))}.`,
    location: pick(rand, STATES),
    modelYear: year,
    ownedMonths,
    usage,
    usageUnit: unit,
    useCase,
    experience: pick(rand, EXPERIENCE),
    verified: rand() < 0.62,
    rating,
    sub,
    title: pick(rand, titles),
    body: `${pick(rand, openers)} ${pro} really stands out.${issueLine}${close}`,
    pros: pro,
    cons: hitIssue ? `${con}; ${hitIssue.title.toLowerCase()}` : con,
    recommend: rating >= 4 || (rating === 3 && rand() < 0.5),
    helpful: Math.floor(rand() * 80),
    daysAgo: Math.floor(between(rand, 1, 700)),
  };
}

let cache: Review[] | null = null;
export function allReviews(): Review[] {
  if (!cache) {
    cache = CATALOG.flatMap((m) => {
      const rand = mulberry32(hash(m.slug + ":reviews"));
      const n = 10 + Math.floor(rand() * 14);
      return Array.from({ length: n }, (_, i) => buildReview(m, i, rand));
    });
  }
  return cache;
}

export interface ReviewFilters {
  q?: string;
  category?: string;
  make?: string[];
  model?: string;
  minRating?: number;
  useCase?: string;
  experience?: string;
  minYear?: number;
  verified?: boolean;
  mentionsIssues?: boolean;
  focus?: SubRating;
  sort?: string;
}

export function filterReviews(f: ReviewFilters) {
  const q = f.q?.trim().toLowerCase();
  const rows = allReviews().filter((r) => {
    if (f.category && r.model.category !== f.category) return false;
    if (f.make?.length && !f.make.includes(r.model.make)) return false;
    if (f.model && r.modelSlug !== f.model) return false;
    if (f.minRating && r.rating < f.minRating) return false;
    if (f.useCase && r.useCase !== f.useCase) return false;
    if (f.experience && r.experience !== f.experience) return false;
    if (f.minYear && r.modelYear < f.minYear) return false;
    if (f.verified && !r.verified) return false;
    if (f.mentionsIssues && !/ran into/.test(r.body)) return false;
    if (q && !`${r.title} ${r.body} ${r.pros} ${r.cons} ${r.model.make} ${r.model.model}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const sorters: Record<string, (a: Review, b: Review) => number> = {
    helpful: (a, b) => b.helpful - a.helpful,
    newest: (a, b) => a.daysAgo - b.daysAgo,
    highest: (a, b) => b.rating - a.rating || b.helpful - a.helpful,
    lowest: (a, b) => a.rating - b.rating || b.helpful - a.helpful,
    "most-used": (a, b) => b.ownedMonths - a.ownedMonths,
  };
  if (f.focus) {
    const k = f.focus;
    return rows.sort((a, b) => b.sub[k] - a.sub[k] || b.helpful - a.helpful);
  }
  return rows.sort(sorters[f.sort ?? "helpful"] ?? sorters.helpful);
}

export interface ModelScore {
  avg: number;
  count: number;
  sub: Record<SubRating, number>;
  recommendPct: number;
  dist: number[]; // index 0 = 1-star
}

export function scoreFor(slug: string): ModelScore {
  const rs = allReviews().filter((r) => r.modelSlug === slug);
  const avg = (fn: (r: Review) => number) => (rs.length ? rs.reduce((s, r) => s + fn(r), 0) / rs.length : 0);
  const sub = Object.fromEntries(SUB_RATINGS.map((k) => [k, avg((r) => r.sub[k])])) as Record<SubRating, number>;
  const dist = [1, 2, 3, 4, 5].map((s) => rs.filter((r) => r.rating === s).length);
  return {
    avg: avg((r) => r.rating),
    count: rs.length,
    sub,
    recommendPct: Math.round(avg((r) => (r.recommend ? 100 : 0))),
    dist,
  };
}

export { getModel };
