"use client";

import { useState } from "react";
import BookCard from "./BookCard";
import UploadBookButton from "./UploadBookButton";
import type { BookSummary } from "@/lib/types";

export default function LibraryClient({ initialBooks }: { initialBooks: BookSummary[] }) {
  const [books, setBooks] = useState(initialBooks);

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 flex-1 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your library</h1>
          <p className="text-sm text-muted mt-1">
            {books.length === 0
              ? "Add a PDF to get started."
              : `${books.length} book${books.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <UploadBookButton onUploaded={(book) => setBooks((prev) => [book, ...prev])} />
      </div>

      {books.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-2xl py-24 gap-3">
          <p className="text-muted max-w-sm">
            This is your private shelf. Upload a PDF book and start highlighting the parts
            worth keeping.
          </p>
          <UploadBookButton onUploaded={(book) => setBooks((prev) => [book, ...prev])} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onDeleted={(id) => setBooks((prev) => prev.filter((b) => b.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
