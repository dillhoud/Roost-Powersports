"use client";

import { useMemo, useState } from "react";
import StashCard from "./StashCard";
import type { Stash, TagWithCount } from "@/lib/types";

export default function StashFeedClient({
  initialStashes,
  initialTags,
}: {
  initialStashes: Stash[];
  initialTags: TagWithCount[];
}) {
  const [stashes, setStashes] = useState(initialStashes);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stashes.filter((s) => {
      if (activeTag && !s.tags.some((t) => t.tag.name === activeTag)) return false;
      if (!q) return true;
      return (
        s.excerpt.toLowerCase().includes(q) ||
        (s.note ?? "").toLowerCase().includes(q) ||
        s.book.title.toLowerCase().includes(q) ||
        s.tags.some((t) => t.tag.name.includes(q))
      );
    });
  }, [stashes, query, activeTag]);

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-8 flex-1 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your stash</h1>
        <p className="text-sm text-muted mt-1">
          {stashes.length} passage{stashes.length === 1 ? "" : "s"} saved across your library
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your stash…"
          className="w-full rounded-lg bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
        />

        {initialTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTag(null)}
              className={`text-xs px-2.5 py-1 rounded-full border ${
                activeTag === null
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              All
            </button>
            {initialTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  activeTag === tag.name
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                #{tag.name} <span className="opacity-60">{tag._count.stashes}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center border border-dashed border-border rounded-2xl py-24">
          <p className="text-muted max-w-sm">
            {stashes.length === 0
              ? "Nothing saved yet. Open a book and highlight a passage to stash it here."
              : "No stashes match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <StashCard
              key={s.id}
              stash={s}
              onDeleted={(id) => setStashes((prev) => prev.filter((x) => x.id !== id))}
              onUpdated={(updated) =>
                setStashes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
              }
              onTagClick={(tag) => setActiveTag(tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
