"use client";

import { useEffect, useRef, useState } from "react";
import { loadPdfjs } from "@/lib/pdfjs-client";
import type * as PDFJS from "pdfjs-dist";

function fallbackHue(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) % 360;
  }
  return hash;
}

export default function BookCover({ bookId, title }: { bookId: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let task: PDFJS.PDFDocumentLoadingTask | null = null;

    (async () => {
      const pdfjsLib = await loadPdfjs();
      if (cancelled) return;
      task = pdfjsLib.getDocument({ url: `/api/books/${bookId}/file` });
      try {
        const doc = await task.promise;
        if (cancelled) return;
        const page = await doc.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = 320;
        const scale = targetWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        if (!cancelled) setReady(true);
        doc.cleanup?.();
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      task?.destroy();
    };
  }, [bookId]);

  if (failed) {
    const hue = fallbackHue(title);
    return (
      <div
        className="w-full h-full flex items-center justify-center p-4 text-center"
        style={{
          background: `linear-gradient(160deg, hsl(${hue} 45% 22%), hsl(${hue} 35% 12%))`,
        }}
      >
        <span className="text-sm font-medium text-foreground/90 line-clamp-4">{title}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-surface-2 flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full transition-opacity duration-300 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
