import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/issues", label: "Buyer's checklist" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/sources", label: "Offer pages" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/catalog", label: "Catalog" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-carbon-800 pb-4">
        <div className="flex items-center gap-6">
          <span className="eyebrow rounded-sm bg-brand-500 px-2 py-1 text-white">Admin</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm font-semibold uppercase tracking-wider text-zinc-400 hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={logout}>
          <button className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white">Log out</button>
        </form>
      </div>
      {children}
    </div>
  );
}
