import { isAdmin } from "@/lib/auth";
import { hasDb, prisma } from "@/lib/db";
import { snowmobileCatalog } from "@/lib/fitment/catalog";
import { getDraft, getLiveCatalog } from "@/lib/fitment/store";

export const dynamic = "force-dynamic";

/** Download a catalog version as JSON: ?id=draft | live | seed | <version id>. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Not allowed", { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "live";
  let data: unknown = null;
  if (id === "seed") data = snowmobileCatalog;
  else if (id === "live") data = await getLiveCatalog();
  else if (id === "draft") data = (await getDraft())?.catalog ?? null;
  else if (hasDb) data = (await prisma.catalogVersion.findUnique({ where: { id } }))?.data ?? null;
  if (!data) return new Response("Not found", { status: 404 });
  const name = `snowmobile-catalog-${(data as { version?: string }).version ?? id}.json`;
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${name}"` },
  });
}
