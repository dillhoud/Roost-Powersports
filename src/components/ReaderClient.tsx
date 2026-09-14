"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PdfViewer, { type PendingSelection } from "./PdfViewer";
import SaveStashDialog from "./SaveStashDialog";
import StashCard from "./StashCard";
import type { BookSummary, Stash } from "@/lib/types";

export default function ReaderClient({
  book,
  initialStashes,
  initialTagNames,
  initialPage,
}: {
  book: BookSummary;
  initialStashes: Stash[];
  initialTagNames: string[];
  initialPage: number;
}) {
  const [stashes, setStashes] = useState(initialStashes);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const currentPageRef = useRef(initialPage);

  useEffect(() => {
    fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ touch: true }),
    }).catch(() => {});
  }, [book.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastPage: currentPageRef.current }),
      }).catch(() => {});
    }, 4000);
    return () => {
      clearInterval(interval);
      fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastPage: currentPageRef.current }),
        keepalive: true,
      }).catch(() => {});
    };
  }, [book.id]);

  return (
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border bg-surface/60">
          <div className="min-w-0">
            <Link href="/" className="text-xs text-muted hover:text-foreground">
              ← Library
            </Link>
            <h1 className="font-medium truncate">{book.title}</h1>
          </div>
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-surface-2 whitespace-nowrap"
          >
            {panelOpen ? "Hide stashes" : `Stashes (${stashes.length})`}
          </button>
        </div>

        <PdfViewer
          bookId={book.id}
          initialPage={initialPage}
          onPageChange={(p) => {
            currentPageRef.current = p;
          }}
          onRequestSaveStash={setPending}
        />
      </div>

      {panelOpen && (
        <aside className="w-80 shrink-0 border-l border-border bg-surface/40 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium">Stashes from this book</h2>
            <p className="text-xs text-muted mt-0.5">
              Select text on the page and save it here.
            </p>
          </div>
          <div className="flex-1 overflow-auto p-3 flex flex-col gap-3">
            {stashes.length === 0 && (
              <p className="text-xs text-muted p-2">
                Nothing saved yet — highlight a passage to start.
              </p>
            )}
            {stashes.map((s) => (
              <StashCard
                key={s.id}
                stash={s}
                showBook={false}
                onDeleted={(id) => setStashes((prev) => prev.filter((x) => x.id !== id))}
                onUpdated={(updated) =>
                  setStashes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                }
              />
            ))}
          </div>
        </aside>
      )}

      {pending && (
        <SaveStashDialog
          bookId={book.id}
          selection={pending}
          existingTags={initialTagNames}
          onClose={() => setPending(null)}
          onSaved={(stash) => {
            setStashes((prev) => [stash, ...prev]);
            setPending(null);
          }}
        />
      )}
    </div>
  );
}
