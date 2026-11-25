import Link from "next/link";
import { snowmobileCatalog } from "@/lib/fitment/catalog";
import { optionsFor } from "@/lib/fitment/engine";
import { hasDb } from "@/lib/db";
import { SnowmobileConfigurator } from "@/components/SnowmobileConfigurator";

export const metadata = { title: "List a snowmobile" };

export default function NewListing() {
  return (
    <div>
      <Link href="/admin/listings" className="text-sm text-zinc-500 hover:text-white">← Listings</Link>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase italic tracking-tight text-white">List a snowmobile</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-500">
        Pick the machine step by step. Each step only shows what was actually sold for the choices before it, so the factory equipment
        on the listing matches the machine.
      </p>
      {!hasDb && <p className="mt-4 rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">No database is connected, so you can try the form but it can&apos;t be saved.</p>}
      <div className="mt-6">
        <SnowmobileConfigurator initial={optionsFor(snowmobileCatalog, {})} />
      </div>
    </div>
  );
}
