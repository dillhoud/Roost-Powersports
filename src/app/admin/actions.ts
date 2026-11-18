"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATALOG, CATEGORIES } from "@/data/catalog";
import { BRAND_SITES, PROMO_TYPES } from "@/data/promos";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { fromKind, fromPromoType } from "@/lib/content";
import { hasDb, prisma } from "@/lib/db";
import { loadStarterContent } from "@/lib/starter";
import { checkAllSources, checkSource } from "@/lib/watch";

// ── helpers ──────────────────────────────────────────────

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const lines = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
const int = (s: string) => (Number.isFinite(Number(s)) ? Math.max(0, Math.round(Number(s))) : 0);

function fail(back: string, msg: string): never {
  redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(msg)}`);
}

/** Only ever redirect back inside the admin. */
function safeBack(fd: FormData, fallback: string) {
  const b = str(fd, "back");
  return b.startsWith("/admin/") && !b.startsWith("//") ? b : fallback;
}

function refreshPublicPages() {
  revalidatePath("/", "layout");
}

async function guard() {
  await requireAdmin();
  if (!hasDb) redirect("/admin");
}

// ── session ──────────────────────────────────────────────

export async function login(fd: FormData) {
  if (!checkPassword(str(fd, "password"))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    redirect("/admin/login?error=1");
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function loadStarter() {
  await guard();
  await loadStarterContent(prisma);
  refreshPublicPages();
  redirect("/admin");
}

// ── issues ───────────────────────────────────────────────

const SEVERITIES = ["minor", "moderate", "major"];
const KINDS = ["owner-reported", "service-bulletin", "recall"];

export async function saveIssue(fd: FormData) {
  await guard();
  const id = str(fd, "id");
  const back = `/admin/issues/${id || "new"}`;

  const modelSlug = str(fd, "modelSlug");
  const severity = str(fd, "severity");
  const kind = str(fd, "kind");
  const sourceUrls = lines(str(fd, "sourceUrls"));
  if (!CATALOG.some((m) => m.slug === modelSlug)) fail(back, "Pick a model");
  if (!SEVERITIES.includes(severity)) fail(back, "Pick a severity");
  if (!KINDS.includes(kind)) fail(back, "Pick a source type");
  for (const u of ["title", "symptoms", "fix"]) if (!str(fd, u)) fail(back, `${u[0].toUpperCase() + u.slice(1)} is required`);
  for (const u of sourceUrls) if (!/^https?:\/\/\S+$/i.test(u)) fail(back, `Not a valid link: ${u}`);

  const data = {
    modelSlug,
    title: str(fd, "title"),
    severity: severity as "minor" | "moderate" | "major",
    kind: fromKind(kind),
    years: str(fd, "years") || "All",
    symptoms: str(fd, "symptoms"),
    fix: str(fd, "fix"),
    estCost: str(fd, "estCost"),
    mentions: int(str(fd, "mentions")),
    sources: lines(str(fd, "sources")),
    sourceUrls,
    published: fd.get("published") === "on",
    ...(fd.get("verified") === "on" ? { lastVerified: new Date() } : {}),
  };
  if (id) await prisma.issue.update({ where: { id }, data });
  else await prisma.issue.create({ data });
  refreshPublicPages();
  redirect("/admin/issues?saved=1");
}

export async function deleteIssue(fd: FormData) {
  await guard();
  await prisma.issue.delete({ where: { id: str(fd, "id") } });
  refreshPublicPages();
  redirect("/admin/issues?deleted=1");
}

export async function quickIssue(fd: FormData) {
  await guard();
  const id = str(fd, "id");
  const op = str(fd, "op");
  if (op === "verify") await prisma.issue.update({ where: { id }, data: { lastVerified: new Date() } });
  if (op === "publish") await prisma.issue.update({ where: { id }, data: { published: true } });
  if (op === "unpublish") await prisma.issue.update({ where: { id }, data: { published: false } });
  refreshPublicPages();
  redirect(safeBack(fd, "/admin/issues"));
}

// ── deals ────────────────────────────────────────────────

export async function savePromo(fd: FormData) {
  await guard();
  const id = str(fd, "id");
  const back = `/admin/deals/${id || "new"}`;

  const type = str(fd, "type");
  const categories = fd.getAll("categories").map(String).filter((c) => CATEGORIES.some((x) => x.id === c));
  const ends = new Date(str(fd, "ends"));
  const verifyUrl = str(fd, "verifyUrl");
  if (!str(fd, "make")) fail(back, "Brand is required");
  if (!PROMO_TYPES.some((t) => t.id === type)) fail(back, "Pick an offer type");
  for (const u of ["title", "amount", "eligibility"]) if (!str(fd, u)) fail(back, `${u[0].toUpperCase() + u.slice(1)} is required`);
  if (!categories.length) fail(back, "Tick at least one vehicle type");
  if (Number.isNaN(ends.getTime())) fail(back, "End date is required");
  if (!/^https?:\/\/\S+$/i.test(verifyUrl)) fail(back, "Verify link must be a full URL (https://…)");

  const data = {
    make: str(fd, "make"),
    type: fromPromoType(type),
    title: str(fd, "title"),
    amount: str(fd, "amount"),
    value: int(str(fd, "value")),
    categories,
    models: str(fd, "models") || null,
    eligibility: str(fd, "eligibility"),
    ends,
    verifyUrl,
    published: fd.get("published") === "on",
    ...(fd.get("verified") === "on" ? { lastVerified: new Date() } : {}),
  };
  if (id) await prisma.promo.update({ where: { id }, data });
  else await prisma.promo.create({ data });
  refreshPublicPages();
  redirect("/admin/deals?saved=1");
}

export async function deletePromo(fd: FormData) {
  await guard();
  await prisma.promo.delete({ where: { id: str(fd, "id") } });
  refreshPublicPages();
  redirect("/admin/deals?deleted=1");
}

export async function quickPromo(fd: FormData) {
  await guard();
  const id = str(fd, "id");
  const op = str(fd, "op");
  if (op === "verify") await prisma.promo.update({ where: { id }, data: { lastVerified: new Date() } });
  if (op === "publish") await prisma.promo.update({ where: { id }, data: { published: true } });
  if (op === "unpublish") await prisma.promo.update({ where: { id }, data: { published: false } });
  refreshPublicPages();
  redirect(safeBack(fd, "/admin/deals"));
}

// ── offer pages ──────────────────────────────────────────

export async function saveSource(fd: FormData) {
  await guard();
  const id = str(fd, "id");
  const back = id ? `/admin/sources/${id}` : "/admin/sources";
  const make = str(fd, "make");
  const url = str(fd, "url");
  if (!make) fail(back, "Pick a brand");
  if (!/^https?:\/\/\S+$/i.test(url)) fail(back, "Enter the full link, starting with https://");
  const data = { make, url, label: str(fd, "label"), active: id ? fd.get("active") === "on" : true };
  if (id) {
    const old = await prisma.offerSource.findUnique({ where: { id } });
    // A new link starts fresh, so the first check becomes the new starting point.
    const reset = old && old.url !== url ? { hash: null, text: null, previousText: null, status: "new" as const, needsReview: false, error: null } : {};
    await prisma.offerSource.update({ where: { id }, data: { ...data, ...reset } });
  } else {
    const created = await prisma.offerSource.create({ data });
    await checkSource(prisma, created);
    redirect("/admin/sources?added=1");
  }
  redirect("/admin/sources?updated=1");
}

export async function deleteSource(fd: FormData) {
  await guard();
  await prisma.offerSource.delete({ where: { id: str(fd, "id") } });
  redirect("/admin/sources?deleted=1");
}

export async function checkSourceNow(fd: FormData) {
  await guard();
  const s = await prisma.offerSource.findUnique({ where: { id: str(fd, "id") } });
  if (s) await checkSource(prisma, s);
  redirect(safeBack(fd, "/admin/sources"));
}

export async function checkAllNow() {
  await guard();
  await checkAllSources(prisma);
  redirect("/admin/sources?checked=1");
}

export async function reviewSource(fd: FormData) {
  await guard();
  await prisma.offerSource.update({ where: { id: str(fd, "id") }, data: { needsReview: false, status: "ok", reviewedAt: new Date() } });
  redirect(safeBack(fd, "/admin/sources"));
}

/** Adds each brand's Canadian site as a starting point, to be swapped for its offers page. */
export async function addBrandSources() {
  await guard();
  const existing = new Set((await prisma.offerSource.findMany({ select: { make: true } })).map((s) => s.make));
  const data = Object.entries(BRAND_SITES)
    .filter(([make]) => !existing.has(make))
    .map(([make, url]) => ({ make, url, label: "Brand home page: replace with the offers page" }));
  if (data.length) await prisma.offerSource.createMany({ data });
  await checkAllSources(prisma);
  redirect("/admin/sources?checked=1");
}
