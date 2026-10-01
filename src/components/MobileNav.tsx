"use client";

import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/listings", label: "Buy" },
  { href: "/research", label: "Research" },
  { href: "/reviews", label: "Reviews" },
  { href: "/issues", label: "Known Issues" },
  { href: "/deals", label: "Deals" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-sm p-2 hover:bg-carbon-800">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-16 border-b border-carbon-800 bg-carbon-950 p-2 shadow-lg">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-sm px-3 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-200 hover:bg-carbon-800">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
