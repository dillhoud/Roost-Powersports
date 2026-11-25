import { snowmobileCatalog } from "@/lib/fitment/catalog";
import { optionsFor } from "@/lib/fitment/engine";

/**
 * Valid next choices for a snowmobile configuration.
 * GET /api/snowmobiles/fitment/options?year=2023&manufacturer=ski_doo&family=summit&trim=summit_x_850&package=154
 */
export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const str = (k: string) => q.get(k) || undefined;
  const year = Number(q.get("year"));
  return Response.json(
    optionsFor(snowmobileCatalog, {
      year: Number.isInteger(year) && year > 0 ? year : undefined,
      manufacturer: str("manufacturer"),
      family: str("family") ?? str("modelFamily"),
      trim: str("trim"),
      package: str("package"),
    }),
  );
}
