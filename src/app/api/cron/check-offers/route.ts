import { timingSafeEqual } from "node:crypto";
import { hasDb, prisma } from "@/lib/db";
import { checkAllSources } from "@/lib/watch";

// Runs once a day from Vercel Cron (see vercel.json).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    // Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
    const got = Buffer.from(req.headers.get("authorization") ?? "");
    const want = Buffer.from(`Bearer ${secret}`);
    return got.length === want.length && timingSafeEqual(got, want);
  }
  // Without a secret, only accept Vercel's scheduler. Pages checked recently are
  // skipped (below), so a stray request can't hammer the brands' sites.
  return (req.headers.get("user-agent") ?? "").includes("vercel-cron");
}

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: "Not allowed" }, { status: 401 });
  if (!hasDb) return Response.json({ error: "No database configured" }, { status: 503 });
  const results = await checkAllSources(prisma, { skipCheckedWithinHours: process.env.CRON_SECRET ? undefined : 6 });
  return Response.json({
    checked: results.length,
    changed: results.filter((r) => r.status === "changed").length,
    errors: results.filter((r) => r.status === "error").length,
  });
}
