import type { Category } from "@/data/catalog";
import clsx from "clsx";

const COLOR_HEX: Record<string, string> = {
  Black: "#1f2937", White: "#e5e7eb", Red: "#dc2626", Blue: "#2563eb", Gray: "#6b7280",
  Green: "#15803d", Orange: "#f97316", Camo: "#4d5d3a", Yellow: "#eab308",
};

const BG: Record<Category, string> = {
  atv: "from-amber-100 to-lime-100",
  sxs: "from-orange-100 to-amber-50",
  snowmobile: "from-sky-100 to-slate-50",
  motorcycle: "from-slate-200 to-zinc-50",
};

/** Lightweight illustrated placeholder until real listing photos are wired up. */
export function VehicleArt({ category, color = "Orange", className }: { category: Category; color?: string; className?: string }) {
  const c = COLOR_HEX[color] ?? "#f97316";
  return (
    <div className={clsx("relative flex items-center justify-center overflow-hidden bg-gradient-to-br", BG[category], className)}>
      <svg viewBox="0 0 200 110" className="h-4/5 w-4/5" aria-hidden>
        <ellipse cx="100" cy="100" rx="85" ry="6" fill="#0f172a" opacity="0.12" />
        {category === "atv" && (
          <g>
            <circle cx="50" cy="80" r="20" fill="#111827" /><circle cx="50" cy="80" r="8" fill="#9ca3af" />
            <circle cx="150" cy="80" r="20" fill="#111827" /><circle cx="150" cy="80" r="8" fill="#9ca3af" />
            <path d="M30 62 L70 52 L90 40 L120 40 L132 52 L172 60 L168 70 L32 72 Z" fill={c} />
            <rect x="92" y="30" width="34" height="10" rx="4" fill="#111827" />
            <path d="M72 50 L80 30 L92 30" stroke="#111827" strokeWidth="4" fill="none" />
          </g>
        )}
        {category === "sxs" && (
          <g>
            <circle cx="45" cy="82" r="18" fill="#111827" /><circle cx="45" cy="82" r="7" fill="#9ca3af" />
            <circle cx="155" cy="82" r="18" fill="#111827" /><circle cx="155" cy="82" r="7" fill="#9ca3af" />
            <path d="M22 70 L35 56 L70 54 L80 30 L140 26 L160 52 L182 58 L180 72 Z" fill={c} />
            <path d="M80 30 L88 14 L150 12 L160 52" stroke="#111827" strokeWidth="4" fill="none" />
            <path d="M92 32 L136 30 L150 52 L86 54 Z" fill="#111827" opacity="0.6" />
          </g>
        )}
        {category === "snowmobile" && (
          <g>
            <path d="M20 92 L120 92 Q140 92 150 84" stroke="#111827" strokeWidth="5" fill="none" strokeLinecap="round" />
            <rect x="70" y="72" width="110" height="16" rx="6" fill="#111827" />
            <path d="M28 76 L60 46 L100 40 L120 52 L176 58 L180 72 L40 80 Z" fill={c} />
            <path d="M62 44 L76 24 L92 22" stroke="#111827" strokeWidth="4" fill="none" />
            <rect x="110" y="48" width="44" height="10" rx="4" fill="#111827" />
          </g>
        )}
        {category === "motorcycle" && (
          <g>
            <circle cx="45" cy="76" r="22" fill="none" stroke="#111827" strokeWidth="7" />
            <circle cx="155" cy="76" r="22" fill="none" stroke="#111827" strokeWidth="7" />
            <path d="M45 76 L80 50 L120 50 L155 76" stroke="#374151" strokeWidth="5" fill="none" />
            <path d="M70 40 Q95 30 118 40 L120 54 L82 56 Z" fill={c} />
            <path d="M118 42 L150 46 L154 52 L120 52 Z" fill="#111827" />
            <path d="M68 40 L58 22 L46 22" stroke="#111827" strokeWidth="4" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
}
