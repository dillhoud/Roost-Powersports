"use client";

import { useState } from "react";
import Link from "next/link";
import type { Stash } from "@/lib/types";

export default function StashCard({
  stash,
  showBook = true,
  onDeleted,
  onUpdated,
  onTagClick,
}: {
  stash: Stash;
  showBook?: boolean;
  onDeleted?: (id: string) => void;
  onUpdated?: (stash: Stash) => void;
  onTagClick?: (tag: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(stash.note ?? "");
  const [tagsInput, setTagsInput] = useState(stash.tags.map((t) => t.tag.name).join(", "));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveEdits() {
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch(`/api/stashes/${stash.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, tags }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdated?.(updated);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/stashes/${stash.id}`, { method: "DELETE" });
      if (res.ok) onDeleted?.(stash.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 stash-card-${stash.color}`}>
      <blockquote className="text-sm whitespace-pre-wrap text-foreground/95">
        “{stash.excerpt}”
      </blockquote>

      {editing ? (
        <div className="flex flex-col gap-2 mt-1">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Note"
            className="w-full rounded-md bg-surface-2 border border-border px-2 py-1.5 text-xs focus:outline-none focus:border-accent resize-none"
          />
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="tags, comma, separated"
            className="w-full rounded-md bg-surface-2 border border-border px-2 py-1.5 text-xs focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="text-xs px-2 py-1 rounded hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              onClick={saveEdits}
              disabled={saving}
              className="text-xs px-2 py-1 rounded bg-accent text-accent-foreground disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {stash.note && <p className="text-xs text-muted italic">{stash.note}</p>}

          {stash.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {stash.tags.map(({ tag }) => (
                <button
                  key={tag.id}
                  onClick={() => onTagClick?.(tag.name)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-surface-2 hover:bg-border text-muted hover:text-foreground transition-colors"
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-1 text-[11px] text-muted">
        <div className="flex items-center gap-1.5 min-w-0">
          {showBook && (
            <Link
              href={`/books/${stash.bookId}?page=${stash.page}`}
              className="truncate hover:text-foreground"
            >
              {stash.book.title}
            </Link>
          )}
          <span>· p.{stash.page}</span>
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="hover:text-foreground">
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="hover:text-red-400"
            >
              {deleting ? "…" : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
