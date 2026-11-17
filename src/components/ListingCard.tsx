import Link from "next/link";
import { JUST_LISTED_DAYS, STALE_DAYS, lastDropDaysAgo, type Listing } from "@/lib/listings";
import { estPayment } from "@/lib/finance";
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
            <h3 className="font-bold leading-tight group-hover:text-brand-400">
              {l.year} {l.model.make} {l.model.model}
            </h3>
            <p className="text-sm text-zinc-500">
              {l.condition === "new" ? "New" : `${num(l.usage)} ${l.usageUnit}`} · {l.color} · {l.city.name}, {l.city.state}
              {distance !== undefined && ` (${distance} mi)`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-extrabold">{usd(l.price)}</div>
            {l.priceDrop > 0 ? (
              <div className="text-xs font-semibold text-emerald-400">↓ {usd(l.priceDrop)} · {ago(lastDropDaysAgo(l) ?? 0)}</div>
            ) : (
              <div className="text-xs text-zinc-500">≈ {usd(estPayment(l.price))}/mo est.</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DealBadge deal={l.deal} />
          <span className="text-xs text-zinc-500">
            {l.savings >= 0 ? `${usd(l.savings)} below` : `${usd(-l.savings)} above`} est. market {usd(l.marketValue)}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {l.oneOwner && <span className="chip">1 owner</span>}
          {l.titleStatus === "Rebuilt" && <span className="chip border-red-500/30 bg-red-500/10 text-red-400">Rebuilt title</span>}
          {l.features.slice(0, 3).map((f) => (
            <span key={f} className="chip">{f}</span>
          ))}
          <span className="chip">{l.sellerType === "dealer" ? l.seller : "Private seller"}</span>
          {l.daysOnMarket <= JUST_LISTED_DAYS ? (
            <span className="chip border-brand-500/40 bg-brand-500/10 text-brand-400">Just listed</span>
          ) : l.daysOnMarket >= STALE_DAYS ? (
            <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-300">{l.daysOnMarket} days listed · make an offer</span>
          ) : (
            <span className="chip">{l.daysOnMarket}d on market</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ago(days: number) {
  return days === 0 ? "dropped today" : days === 1 ? "dropped yesterday" : `dropped ${days}d ago`;
}
