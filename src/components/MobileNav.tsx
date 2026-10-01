"use client";

import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/listings", label: "Buy" },
  { href: "/research", label: "Research" },
  { href: "/reviews", label: "Reviews" },
  { href: "/issues", label: "Common Issues" },
  { href: "/deals", label: "Deals & Discounts" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-md p-2 hover:bg-slate-800">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-16 border-b border-slate-800 bg-slate-900 p-2 shadow-lg">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 font-medium text-slate-100 hover:bg-slate-800">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
