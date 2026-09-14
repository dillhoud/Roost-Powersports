"use client";

import { useRef, useState } from "react";
import type { BookSummary } from "@/lib/types";

export default function UploadBookButton({
  onUploaded,
}: {
  onUploaded: (book: BookSummary) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const pdfFiles = Array.from(files).filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (pdfFiles.length === 0) {
      setError("Please choose a PDF file.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      for (const file of pdfFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/books", { method: "POST", body: formData });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to upload ${file.name}`);
        }
        const book = await res.json();
        onUploaded(book);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label
        htmlFor="pdf-upload"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-sm font-medium transition-colors ${
          dragOver
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-surface hover:bg-surface-2 text-foreground"
        }`}
      >
        {uploading ? "Uploading…" : "+ Add PDF"}
      </label>
      <input
        ref={inputRef}
        id="pdf-upload"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        disabled={uploading}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
