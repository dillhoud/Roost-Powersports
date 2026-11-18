import "server-only";
import { createHash } from "node:crypto";
import type { OfferSource, PrismaClient } from "@prisma/client";

const TIMEOUT_MS = 15_000;
const MAX_BYTES = 3_000_000;
const UA = "Mozilla/5.0 (compatible; RoostOfferWatcher/1.0; checks public offer pages once a day)";

/** Lines that look like offer details: money, rates, rebates, dates. English and French. */
const OFFER_LINE =
  /(\$\s?\d|\d\s?\$|\d+(?:[.,]\d+)?\s?%|\bAPR\b|\bTAP\b|rebate|offer|save|saving|financ|bonus|cash|promo|incentive|discount|\boff\b|ends|valid|until|expires|rabais|offre|économ|remise|jusqu)/i;

function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&dollar;|&#36;/gi, "$")
    .replace(/&percnt;|&#37;/gi, "%")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&ndash;|&mdash;/gi, "–")
    .replace(/&eacute;/gi, "é")
    .replace(/&egrave;/gi, "è")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

/** Turn a page's HTML into its visible lines of text. */
export function htmlToLines(html: string) {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|head)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|hr)\b[^>]*>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|td|th|section|article|header|footer|a|span|button|dt|dd)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of decodeEntities(text).split("\n")) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (line.length < 4 || seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}

/** The lines on a page that describe offers. Menus, footers and the like are ignored. */
export function offerLines(lines: string[]) {
  return lines.filter((l) => l.length >= 8 && l.length <= 400 && OFFER_LINE.test(l));
}

export type FetchResult =
  | { ok: true; httpStatus: number; lines: string[]; totalLines: number }
  | { ok: false; httpStatus?: number; error: string };

export async function fetchOfferLines(url: string): Promise<FetchResult> {
  if (!/^https?:\/\//i.test(url)) return { ok: false, error: "The link must start with http:// or https://" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-CA,en;q=0.9,fr-CA;q=0.8" },
    });
    if (res.status === 401 || res.status === 403 || res.status === 429) {
      return { ok: false, httpStatus: res.status, error: "The site blocked the automatic check. Check this page by hand." };
    }
    if (res.status === 404 || res.status === 410) {
      return { ok: false, httpStatus: res.status, error: "Page not found. The brand may have moved its offers page, so update the link." };
    }
    if (!res.ok) return { ok: false, httpStatus: res.status, error: `The site answered with an error (${res.status}). It will be tried again tomorrow.` };
    const html = (await res.text()).slice(0, MAX_BYTES);
    const all = htmlToLines(html);
    const lines = offerLines(all);
    if (!lines.length) {
      return {
        ok: false,
        httpStatus: res.status,
        error: "No offer details found on the page. It probably loads offers with JavaScript, so check it by hand.",
      };
    }
    return { ok: true, httpStatus: res.status, lines, totalLines: all.length };
  } catch (e) {
    const aborted = (e as Error).name === "AbortError";
    return { ok: false, error: aborted ? "The page took too long to load. It will be tried again tomorrow." : "Couldn't reach the site. It will be tried again tomorrow." };
  } finally {
    clearTimeout(timer);
  }
}

const hashOf = (lines: string[]) => createHash("sha256").update(lines.join("\n")).digest("hex");

/** Check one page and record what happened. Returns the updated row. */
export async function checkSource(db: PrismaClient, s: OfferSource) {
  const r = await fetchOfferLines(s.url);
  const now = new Date();
  if (!r.ok) {
    return db.offerSource.update({
      where: { id: s.id },
      data: { status: "error", error: r.error, httpStatus: r.httpStatus ?? null, lastCheckedAt: now },
    });
  }
  const text = r.lines.join("\n");
  const hash = hashOf(r.lines);
  if (!s.hash) {
    // First successful check: this is the starting point, nothing to review yet.
    return db.offerSource.update({
      where: { id: s.id },
      data: { status: "ok", error: null, httpStatus: r.httpStatus, text, hash, lastCheckedAt: now },
    });
  }
  if (hash !== s.hash) {
    return db.offerSource.update({
      where: { id: s.id },
      data: {
        status: "changed",
        needsReview: true,
        error: null,
        httpStatus: r.httpStatus,
        previousText: s.text,
        text,
        hash,
        lastCheckedAt: now,
        lastChangedAt: now,
      },
    });
  }
  return db.offerSource.update({
    where: { id: s.id },
    data: { status: s.needsReview ? "changed" : "ok", error: null, httpStatus: r.httpStatus, lastCheckedAt: now },
  });
}

/** Check every active page, a few at a time. */
export async function checkAllSources(db: PrismaClient, opts: { skipCheckedWithinHours?: number } = {}) {
  const cutoff = opts.skipCheckedWithinHours ? new Date(Date.now() - opts.skipCheckedWithinHours * 3_600_000) : undefined;
  const sources = await db.offerSource.findMany({
    where: { active: true, ...(cutoff ? { OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: cutoff } }] } : {}) },
  });
  const results: { id: string; make: string; status: string }[] = [];
  const queue = [...sources];
  async function worker() {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const r = await checkSource(db, s);
      results.push({ id: r.id, make: r.make, status: r.status });
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  return results;
}

/** Lines added and removed between two checks. */
export function diffLines(previous: string | null, current: string | null) {
  const a = new Set((previous ?? "").split("\n").filter(Boolean));
  const b = new Set((current ?? "").split("\n").filter(Boolean));
  return { added: [...b].filter((l) => !a.has(l)), removed: [...a].filter((l) => !b.has(l)) };
}
