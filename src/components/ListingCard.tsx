import Link from "next/link";
import type { Listing } from "@/lib/listings";
import { usd, num } from "@/lib/format";
import { DealBadge } from "./DealBadge";
import { VehicleArt } from "./VehicleArt";

export function ListingCard({ l, distance }: { l: Listing; distance?: number }) {
  return (
    <Link href={`/listings/${l.id}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row">
      <VehicleArt category={l.model.category} color={l.color} className="h-40 sm:h-auto sm:w-56 sm:shrink-0" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-bold leading-tight group-hover:text-brand-600">
              {l.year} {l.model.make} {l.model.model}
            </h3>
            <p className="text-sm text-slate-500">
              {l.condition === "new" ? "New" : `${num(l.usage)} ${l.usageUnit}`} · {l.color} · {l.city.name}, {l.city.state}
              {distance !== undefined && ` (${distance} mi)`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-extrabold">{usd(l.price)}</div>
            {l.priceDrop > 0 && <div className="text-xs font-semibold text-emerald-700">↓ {usd(l.priceDrop)} price drop</div>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DealBadge deal={l.deal} />
          <span className="text-xs text-slate-500">
            {l.savings >= 0 ? `${usd(l.savings)} below` : `${usd(-l.savings)} above`} est. market {usd(l.marketValue)}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {l.oneOwner && <span className="chip">1 owner</span>}
          {l.titleStatus === "Rebuilt" && <span className="chip border-red-200 bg-red-50 text-red-700">Rebuilt title</span>}
          {l.features.slice(0, 3).map((f) => (
            <span key={f} className="chip">{f}</span>
          ))}
          <span className="chip">{l.sellerType === "dealer" ? l.seller : "Private seller"}</span>
          <span className="chip">{l.daysOnMarket}d on market</span>
        </div>
      </div>
    </Link>
  );
}
