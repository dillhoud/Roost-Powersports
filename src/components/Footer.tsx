import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <div className="font-bold text-slate-900">TrailGurus</div>
          <p className="mt-2">The one-stop shop for powersports buyers: deal ratings, honest owner reviews, known issues and every current brand discount.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/listings?category=atv">ATVs for sale</Link>
          <Link href="/listings?category=sxs">Side-by-sides for sale</Link>
          <Link href="/listings?category=snowmobile">Snowmobiles for sale</Link>
          <Link href="/listings?category=motorcycle">Motorcycles for sale</Link>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Demo build: listings, reviews and prices are generated sample data. Common-issue summaries reflect recurring
          owner discussion themes and are not a substitute for a pre-purchase inspection or a VIN recall check.
          Promotions shown are illustrative — always confirm current offers and eligibility with the manufacturer or dealer.
        </p>
      </div>
    </footer>
  );
}
