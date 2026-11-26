import "server-only";
import { hasDb, prisma } from "@/lib/db";
import { snowmobileCatalog as seed } from "./catalog";
import { checkCatalog, nextVersionName } from "./catalog-tools";
import type { Catalog } from "./types";

/**
 * Catalog versions live in the database. The newest published version is live.
 * Until anything is published, the bundled seed catalog is live.
 */

const KIND = "snowmobile";
const asCatalog = (data: unknown) => data as Catalog;

export async function getLiveCatalog(): Promise<Catalog> {
  if (!hasDb) return seed;
  const row = await prisma.catalogVersion.findFirst({ where: { kind: KIND, status: "published" }, orderBy: { publishedAt: "desc" } });
  return row ? asCatalog(row.data) : seed;
}

/** The catalog a saved listing was checked against, for showing its labels. Falls back to live. */
export async function getCatalogByVersion(version: string): Promise<Catalog> {
  if (version === seed.version || !hasDb) return seed;
  const row = await prisma.catalogVersion.findFirst({ where: { kind: KIND, version } });
  return row ? asCatalog(row.data) : getLiveCatalog();
}

export async function getDraft() {
  if (!hasDb) return null;
  const row = await prisma.catalogVersion.findFirst({ where: { kind: KIND, status: "draft" } });
  return row ? { ...row, catalog: asCatalog(row.data) } : null;
}

/** The draft, created from the live catalog if there isn't one yet. */
export async function ensureDraft() {
  const existing = await getDraft();
  if (existing) return existing;
  const live = await getLiveCatalog();
  const row = await prisma.catalogVersion.create({ data: { kind: KIND, version: "draft", status: "draft", data: { ...live, version: "draft" } as object } });
  return { ...row, catalog: asCatalog(row.data) };
}

export async function saveDraft(catalog: Catalog) {
  const d = await ensureDraft();
  await prisma.catalogVersion.update({ where: { id: d.id }, data: { data: { ...catalog, version: "draft" } as object } });
}

export async function discardDraft() {
  await prisma.catalogVersion.deleteMany({ where: { kind: KIND, status: "draft" } });
}

async function versionNames() {
  const rows = await prisma.catalogVersion.findMany({ where: { kind: KIND, status: "published" }, select: { version: true } });
  return [seed.version, ...rows.map((r) => r.version)];
}

/** Publish the draft as a new version. Refuses while the integrity check finds problems. */
export async function publishDraft(note: string) {
  const d = await getDraft();
  if (!d) throw new Error("There's no draft to publish.");
  const problems = checkCatalog({ ...d.catalog, version: "check" });
  if (problems.length) throw new Error(`Fix ${problems.length} problem${problems.length > 1 ? "s" : ""} first.`);
  const version = nextVersionName(await versionNames());
  await prisma.catalogVersion.update({
    where: { id: d.id },
    data: { status: "published", version, note, publishedAt: new Date(), data: { ...d.catalog, version } as object },
  });
  return version;
}

/** Make an old version live again by publishing a copy of it, so history stays in order. */
export async function rollbackTo(idOrSeed: string) {
  const source = idOrSeed === "seed" ? { version: seed.version, catalog: seed } : await prisma.catalogVersion.findUnique({ where: { id: idOrSeed } }).then((r) => (r ? { version: r.version, catalog: asCatalog(r.data) } : null));
  if (!source) throw new Error("That version doesn't exist.");
  const version = nextVersionName(await versionNames());
  await prisma.catalogVersion.create({
    data: { kind: KIND, version, status: "published", note: `Rollback to ${source.version}`, publishedAt: new Date(), data: { ...source.catalog, version } as object },
  });
  return version;
}

export async function listVersions() {
  if (!hasDb) return [];
  return prisma.catalogVersion.findMany({ where: { kind: KIND, status: "published" }, orderBy: { publishedAt: "desc" }, select: { id: true, version: true, note: true, publishedAt: true } });
}

export const seedVersion = seed.version;
