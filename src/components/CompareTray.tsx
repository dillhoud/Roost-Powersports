"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";

/**
 * "Pick models to compare": a toggle on model cards plus a tray at the bottom
 * of the screen. The picks are remembered in this browser only.
 */

const KEY = "roost.compare";
const EVENT = "roost:compare";
const MAX = 3;

type Pick = { slug: string; name: string };

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function write(picks: Pick[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(picks));
  } catch {
    // Storage blocked (private window etc.): picks just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function parse(raw: string): Pick[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((p) => p && typeof p.slug === "string" && typeof p.name === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function usePicks() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  return useMemo(() => parse(raw), [raw]);
}

const hrefFor = (picks: Pick[]) => `/compare?${picks.map((p) => `m=${encodeURIComponent(p.slug)}`).join("&")}`;

/** Tick-box style button for a model. Without JavaScript it's a plain link to compare that model. */
export function CompareToggle({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const picks = usePicks();
  const on = picks.some((p) => p.slug === slug);
  const full = !on && picks.length >= MAX;
  return (
    <a
      href={`/compare?m=${encodeURIComponent(slug)}`}
      role="checkbox"
      aria-checked={on}
      aria-disabled={full || undefined}
      title={full ? `You can compare up to ${MAX} models` : undefined}
      onClick={(e) => {
        e.preventDefault();
        if (on) write(picks.filter((p) => p.slug !== slug));
        else if (!full) write([...picks, { slug, name }]);
      }}
      className={`inline-flex cursor-pointer select-none items-center gap-2 text-xs font-semibold ${full ? "cursor-not-allowed text-zinc-600" : on ? "text-emerald-300" : "text-zinc-300 hover:text-white"} ${className}`}
    >
      <span
        aria-hidden
        className={`flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] ${on ? "border-emerald-400 bg-emerald-500 text-carbon-950" : "border-carbon-600"}`}
      >
        {on ? "✓" : ""}
      </span>
      {on ? "Added to compare" : full ? "Compare is full" : "Compare"}
    </a>
  );
}

/** Bar fixed to the bottom of the screen once something is picked. */
export function CompareTray() {
  const picks = usePicks();
  const pathname = usePathname();
  if (!picks.length || pathname.startsWith("/compare") || pathname.startsWith("/admin")) return null;
  const ready = picks.length >= 2;

  return (
    <>
      {/* Keeps the footer from hiding behind the bar. */}
      <div aria-hidden className="h-32 sm:h-20" />
      <div role="region" aria-label="Models to compare" className="fixed inset-x-0 bottom-0 z-50 border-t border-carbon-700 bg-carbon-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="eyebrow shrink-0 text-zinc-500">Compare {picks.length}/{MAX}</span>
          <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {picks.map((p) => (
              <li key={p.slug} className="chip shrink-0 gap-2 whitespace-nowrap py-1 text-zinc-200">
                {p.name}
                <button
                  type="button"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => write(picks.filter((x) => x.slug !== p.slug))}
                  className="text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </li>
            ))}
            {!ready && <li className="shrink-0 self-center whitespace-nowrap text-xs text-zinc-500">Pick at least one more</li>}
          </ul>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button type="button" onClick={() => write([])} className="text-xs font-semibold text-zinc-500 hover:text-white">Clear</button>
            {ready ? (
              <Link href={hrefFor(picks)} className="btn-primary">Compare now</Link>
            ) : (
              <span className="btn-primary cursor-not-allowed opacity-40" aria-disabled>Compare now</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
