import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasDb, prisma } from "@/lib/db";
import { cad, num, shortDate } from "@/lib/format";
import { getCatalogByVersion } from "@/lib/fitment/store";
import { VERIFIED, type EquipmentEntry } from "@/lib/fitment/types";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteListing, setListingStatus } from "../../../listing-actions";

export const metadata = { title: "Listing" };

const GROUPS: { title: string; origins: EquipmentEntry["origin"][]; note?: string }[] = [
  { title: "Factory equipment", origins: ["factory_standard", "factory_option", "factory_package"] },
  { title: "Dealer-installed accessories", origins: ["dealer_accessory"] },
  { title: "Added after the factory", origins: ["aftermarket"], note: "Seller-reported" },
  { title: "Not known", origins: ["unknown"], note: "The dealer didn't know these" },
];
const ORIGIN = { factory_standard: "Standard", factory_option: "Factory option", factory_package: "Package", dealer_accessory: "Dealer accessory", aftermarket: "Aftermarket", unknown: "" };

export default async function ListingDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  if (!hasDb) redirect("/admin/listings");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const l = await prisma.snowmobileListing.findUnique({ where: { id } });
  if (!l) notFound();
  const equipment = l.equipment as unknown as EquipmentEntry[];
  const mods = l.aftermarket as unknown as { key: string; label: string; note?: string }[];
  const identity = l.identity as unknown as { engine?: string; package?: string };
  const catalog = await getCatalogByVersion(l.catalogVersion);
  const feature = (k: string) => catalog.features.find((f) => f.key === k);
  const valueLabel = (e: EquipmentEntry) => (e.value === "unknown" ? "Unknown" : feature(e.feature)?.values.find((v) => v.value === e.value)?.label ?? e.value);
  const badge =
    l.verification === "verified"
      ? ["Catalog verified", "bg-emerald-500/15 text-emerald-300"]
      : l.verification === "partially_verified"
        ? ["Partially verified", "bg-amber-500/15 text-amber-300"]
        : ["Configuration not verified", "bg-carbon-700 text-zinc-300"];

  return (
    <div className="max-w-5xl">
      <Link href="/admin/listings" className="text-sm text-zinc-500 hover:text-white">← Listings</Link>
      {sp.created && <p className="mt-4 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Saved. This is how the listing reads to buyers.</p>}

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="card p-6">
          <div className="eyebrow text-zinc-500">Listing preview</div>
          <h1 className="mt-2 font-display text-3xl font-bold uppercase italic tracking-tight text-white">{l.title}</h1>
          <p className="text-zinc-400">{[identity.engine, identity.package].filter(Boolean).join(" · ")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-sm px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${badge[1]}`}>{badge[0]}</span>
            <span className="chip">{l.priceType === "fixed" ? "No-haggle price" : "Price negotiable"}</span>
            {l.financing && <span className="chip">Financing available</span>}
            {l.delivery && <span className="chip">Delivery available</span>}
          </div>
          <div className="mt-4 text-3xl font-extrabold">{cad(l.price)}</div>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ["Kilometres", num(l.km)],
              ["Condition", l.grade],
              ["Title", l.titleStatus],
              ["Owners", l.owners === 0 ? "None (new)" : String(l.owners)],
              ["Service records", { full: "Full history", partial: "Some records", none: "None provided" }[l.serviceRecords] ?? l.serviceRecords],
              ["Colour", l.colour || "—"],
              ["VIN / serial", l.vin ?? "Ask the dealer"],
              ["Dealer", `${l.dealer}, ${l.postalCode}`],
              ["Listed", `${shortDate(l.createdAt.toISOString().slice(0, 10))}`],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-zinc-500">{k}</dt><dd className="break-words font-semibold">{v}</dd></div>
            ))}
          </dl>

          {GROUPS.map((g) => {
            const rows = g.origins.includes("aftermarket")
              ? [...equipment.filter((e) => e.origin === "aftermarket").map((e) => ({ k: e.feature, label: feature(e.feature)?.label ?? e.feature, value: valueLabel(e), tag: "" })), ...mods.map((m) => ({ k: m.key, label: m.label, value: m.note ?? "", tag: "" }))]
              : equipment
                  .filter((e) => g.origins.includes(e.origin))
                  .map((e) => ({ k: e.feature, label: feature(e.feature)?.label ?? e.feature, value: valueLabel(e), tag: `${ORIGIN[e.origin]}${e.origin !== "unknown" && !VERIFIED.includes(e.catalog_status) ? " · not yet verified" : ""}` }));
            if (!rows.length) return null;
            return (
              <div key={g.title} className="mt-6">
                <h2 className="font-semibold text-white">{g.title}{g.note && <span className="ml-2 text-xs font-normal text-zinc-500">{g.note}</span>}</h2>
                <ul className="mt-2 divide-y divide-carbon-800 text-sm">
                  {rows.map((r) => (
                    <li key={r.k} className="flex flex-wrap justify-between gap-2 py-2">
                      <span className="text-zinc-400">{r.label}</span>
                      <span className="text-right text-zinc-200">{r.value}{r.tag && <span className="block text-xs text-zinc-500">{r.tag}</span>}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {l.notes && <p className="mt-6 whitespace-pre-line text-sm text-zinc-300">{l.notes}</p>}
        </section>

        <aside className="space-y-4">
          <div className="card p-5 text-sm">
            <div className="font-semibold text-white">Status: <span className="capitalize">{l.status}</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["active", "pending", "sold", "expired"] as const).filter((s) => s !== l.status).map((s) => (
                <form key={s} action={setListingStatus}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="status" value={s} />
                  <button className="btn-ghost w-full capitalize">{s === "pending" ? "Sale pending" : s}</button>
                </form>
              ))}
            </div>
          </div>
          <div className="card p-5 text-xs text-zinc-500">
            Checked against catalog <b className="text-zinc-300">{l.catalogVersion}</b>. Later catalog changes don&apos;t alter this listing&apos;s saved equipment.
          </div>
          <form action={deleteListing}>
            <input type="hidden" name="id" value={l.id} />
            <ConfirmButton message="Delete this listing?" className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300">Delete listing</ConfirmButton>
          </form>
        </aside>
      </div>
    </div>
  );
}
