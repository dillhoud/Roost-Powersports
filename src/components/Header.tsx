import Link from "next/link";
import { MobileNav } from "./MobileNav";

export const NAV = [
  { href: "/listings", label: "Buy" },
  { href: "/research", label: "Research" },
  { href: "/reviews", label: "Reviews" },
  { href: "/issues", label: "Known Issues" },
  { href: "/deals", label: "Deals" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-carbon-800 bg-carbon-950/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Roost home">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-[13px] font-semibold uppercase tracking-wider text-zinc-400 transition hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/listings?condition=used&deal=great"
          className="hidden rounded-sm bg-brand-500 px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-white transition hover:bg-brand-600 md:inline-block"
        >
          Shop deals
        </Link>
        <MobileNav />
      </div>
    </header>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 28 20" className="h-5 w-7" aria-hidden>
        <path d="M2 18 L10 2 H16 L8 18 Z" fill="#e1121f" />
        <path d="M12 18 L20 2 H26 L18 18 Z" fill="currentColor" />
      </svg>
      <span className="font-display text-2xl font-extrabold uppercase italic tracking-tight">Roost</span>
    </span>
  );
}
