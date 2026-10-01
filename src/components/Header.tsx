import Link from "next/link";
import { MobileNav } from "./MobileNav";

export const NAV = [
  { href: "/listings", label: "Buy" },
  { href: "/research", label: "Research" },
  { href: "/reviews", label: "Reviews" },
  { href: "/issues", label: "Common Issues" },
  { href: "/deals", label: "Deals & Discounts" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <Logo />
          <span>Trail<span className="text-brand-500">Gurus</span></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/listings?condition=used&deal=great" className="btn-primary hidden md:inline-flex">
          Great deals
        </Link>
        <MobileNav />
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#f97316" />
      <path d="M5 23 L12 12 L16 18 L19 14 L27 23 Z" fill="#0f172a" />
      <circle cx="22" cy="9" r="2.5" fill="#fff" />
    </svg>
  );
}
