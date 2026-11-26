import Link from "next/link";
import { hasDb, prisma } from "@/lib/db";
import { cad, num, shortDate } from "@/lib/format";
import { Flash } from "../ui";

export const metadata = { title: "Listings" };

const VERIFY = { verified: ["Catalog verified", "text-emerald-300"], partially_verified: ["Partially verified", "text-amber-300"], unverified: ["Not verified", "text-zinc-400"] } as const;

export default async function AdminListings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const rows = hasDb ? await prisma.snowmobileListing.findMany({ orderBy: { createdAt: "desc" } }) : [];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">Listings</h1>
          <p className="mt-1 text-sm text-zinc-500">Snowmobiles listed with the fitment-aware form. Other machine types come next.</p>
        </div>
        <Link href="/admin/listings/new" className="btn-primary">List a snowmobile</Link>
      </div>
      <Flash sp={sp} />
      {!hasDb ? (
        <p className="mt-6 text-sm text-zinc-500">Connect a database to save listings.</p>
      ) : rows.length === 0 ? (
        <p className="card mt-6 p-6 text-sm text-zinc-400">No listings yet. Click <b className="text-white">List a snowmobile</b> to add the first one.</p>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
              <tr><th className="p-3">Machine</th><th className="p-3">Price</th><th className="p-3">Km</th><th className="p-3">Configuration</th><th className="p-3">Status</th><th className="p-3">Listed</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-carbon-800">
                  <td className="p-3"><Link href={`/admin/listings/${r.id}`} className="font-semibold text-white hover:text-brand-400">{r.title}</Link><div className="text-xs text-zinc-500">{r.dealer}</div></td>
                  <td className="p-3">{cad(r.price)}</td>
                  <td className="p-3">{num(r.km)}</td>
                  <td className={`p-3 ${VERIFY[r.verification][1]}`}>{VERIFY[r.verification][0]}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                  <td className="p-3 text-zinc-500">{shortDate(r.createdAt.toISOString().slice(0, 10))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
