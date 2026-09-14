"use client";

import { useState } from "react";
import { STASH_COLORS } from "@/lib/types";
import type { Stash } from "@/lib/types";
import type { PendingSelection } from "./PdfViewer";

export default function SaveStashDialog({
  bookId,
  selection,
  existingTags,
  onClose,
  onSaved,
}: {
  bookId: string;
  selection: PendingSelection;
  existingTags: string[];
  onClose: () => void;
  onSaved: (stash: Stash) => void;
}) {
  const [note, setNote] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [color, setColor] = useState<string>("amber");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/stashes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          page: selection.page,
          excerpt: selection.excerpt,
          note,
          color,
          tags,
        }),
      });
      if (!res.ok) throw new Error("Could not save this stash.");
      const stash = await res.json();
      onSaved(stash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 flex flex-col gap-4 max-h-[85vh] overflow-auto">
        <div>
          <h2 className="font-semibold">Save to Stash</h2>
          <p className="text-xs text-muted">Page {selection.page}</p>
        </div>

        <blockquote className="text-sm border-l-2 border-accent pl-3 text-foreground/90 max-h-40 overflow-auto whitespace-pre-wrap">
          {selection.excerpt}
        </blockquote>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted" htmlFor="stash-note">
            Note (optional)
          </label>
          <textarea
            id="stash-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why does this matter to you?"
            rows={3}
            className="w-full rounded-md bg-surface-2 border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted" htmlFor="stash-tags">
            Tags (comma separated)
          </label>
          <input
            id="stash-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="idea, quote, follow-up"
            list="existing-tags"
            className="w-full rounded-md bg-surface-2 border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <datalist id="existing-tags">
            {existingTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div className="flex items-center gap-2">
          {STASH_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full dot-${c} ${
                color === c ? "ring-2 ring-offset-2 ring-offset-surface ring-accent" : ""
              }`}
              aria-label={c}
              title={c}
            />
          ))}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-sm hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
