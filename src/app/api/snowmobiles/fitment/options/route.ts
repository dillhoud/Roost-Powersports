import { isAdmin } from "@/lib/auth";
import { optionsFor } from "@/lib/fitment/engine";
import { getDraft, getLiveCatalog } from "@/lib/fitment/store";

export const dynamic = "force-dynamic";

/**
 * Valid next choices for a snowmobile configuration.
 * GET /api/snowmobiles/fitment/options?year=2023&manufacturer=ski_doo&family=summit&trim=summit_x_850&package=154
 * Admins can add &catalog=draft to preview the catalog being edited.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const str = (k: string) => q.get(k) || undefined;
  const year = Number(q.get("year"));
  let catalog;
  if (q.get("catalog") === "draft") {
    if (!(await isAdmin())) return Response.json({ error: "Not allowed" }, { status: 401 });
    catalog = (await getDraft())?.catalog;
    if (!catalog) return Response.json({ error: "No draft catalog" }, { status: 404 });
  } else catalog = await getLiveCatalog();
  return Response.json(
    optionsFor(catalog, {
      year: Number.isInteger(year) && year > 0 ? year : undefined,
      manufacturer: str("manufacturer"),
      family: str("family") ?? str("modelFamily"),
      trim: str("trim"),
      package: str("package"),
    }),
  );
}
