"use client";

import Link from "next/link";
import { useState } from "react";
import BookCover from "./BookCover";
import type { BookSummary } from "@/lib/types";

export default function BookCard({
  book,
  onDeleted,
}: {
  book: BookSummary;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
      if (res.ok) onDeleted(book.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  const progress =
    book.pageCount && book.pageCount > 0
      ? Math.min(100, Math.round((book.lastPage / book.pageCount) * 100))
      : null;

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface overflow-hidden hover:border-accent/60 transition-colors">
      <Link href={`/books/${book.id}`} className="block">
        <div className="aspect-[3/4] w-full">
          <BookCover bookId={book.id} title={book.title} />
        </div>
      </Link>

      <div className="p-3 flex-1 flex flex-col gap-1">
        <Link href={`/books/${book.id}`} className="hover:text-accent transition-colors">
          <h3 className="font-medium leading-snug line-clamp-2">{book.title}</h3>
        </Link>
        {book.author && <p className="text-xs text-muted line-clamp-1">{book.author}</p>}

        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted">
          <span>
            {book._count.stashes} stash{book._count.stashes === 1 ? "" : "es"}
          </span>
          {progress !== null && <span>{progress}%</span>}
        </div>
        {progress !== null && (
          <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          setConfirming(true);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white/80 hover:text-white text-xs rounded-full w-7 h-7 flex items-center justify-center"
        title="Remove book"
      >
        ✕
      </button>

      {confirming && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center">
          <p className="text-sm">
            Remove <span className="font-medium">{book.title}</span>? This also deletes its
            saved stashes.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm disabled:opacity-60"
            >
              {deleting ? "Removing…" : "Remove"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
