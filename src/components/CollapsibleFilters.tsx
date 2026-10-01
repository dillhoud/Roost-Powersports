"use client";

import { useState } from "react";

/** Filters are always visible on desktop; on phones they collapse behind a button so results come first. */
export function CollapsibleFilters({ children, label = "Filters" }: { children: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="h-fit lg:sticky lg:top-20">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="btn-ghost w-full lg:hidden">
        {open ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
      </button>
      <div className={open ? "mt-3 lg:mt-0" : "hidden lg:block"}>{children}</div>
    </div>
  );
}
