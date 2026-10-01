import Link from "next/link";
import { Wordmark } from "./Header";

const COLS = [
  { title: "Shop", links: [["ATVs", "/listings?category=atv"], ["Side-by-sides", "/listings?category=sxs"], ["Snowmobiles", "/listings?category=snowmobile"], ["Motorcycles", "/listings?category=motorcycle"]] },
  { title: "Research", links: [["Compare models", "/research"], ["Owner reviews", "/reviews"], ["Known issues", "/issues"]] },
  { title: "Save", links: [["All offers", "/deals"], ["Military & first responder", "/deals?type=military&type=first-responder"], ["Pro & industry", "/deals?type=pro"], ["Farm & ag", "/deals?type=ag"]] },
];

export function Footer() {
  return (
    <footer className="border-t border-carbon-800 bg-carbon-950 text-zinc-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 text-sm md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark className="text-white" />
          <p className="mt-4 max-w-xs leading-relaxed">Powersports marketplace and research. Prices checked against the market, problems reported by owners.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <div className="eyebrow text-zinc-500">{c.title}</div>
            <ul className="mt-4 space-y-2.5">
              {c.links.map(([label, href]) => (
                <li key={href}><Link href={href} className="transition hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-carbon-800">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs leading-relaxed text-zinc-600">
          Preview build — listings, reviews and prices are sample data. Known-issue summaries reflect recurring owner discussion and
          are not a substitute for an inspection or a VIN recall check. Confirm offers and eligibility with the manufacturer or dealer.
        </p>
      </div>
    </footer>
  );
}
