"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadPdfjs } from "@/lib/pdfjs-client";
import type * as PDFJS from "pdfjs-dist";

export interface PendingSelection {
  page: number;
  excerpt: string;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.4;

export default function PdfViewer({
  bookId,
  initialPage,
  onPageChange,
  onRequestSaveStash,
}: {
  bookId: string;
  initialPage: number;
  onPageChange: (page: number) => void;
  onRequestSaveStash: (selection: PendingSelection) => void;
}) {
  const [pageNum, setPageNum] = useState(Math.max(1, initialPage || 1));
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectionPopover, setSelectionPopover] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  const pdfjsRef = useRef<typeof PDFJS | null>(null);
  const pdfRef = useRef<PDFJS.PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let task: PDFJS.PDFDocumentLoadingTask | null = null;

    (async () => {
      const pdfjsLib = await loadPdfjs();
      if (cancelled) return;
      pdfjsRef.current = pdfjsLib;
      task = pdfjsLib.getDocument({ url: `/api/books/${bookId}/file` });
      try {
        const doc = await task.promise;
        if (cancelled) return;
        pdfRef.current = doc;
        setNumPages(doc.numPages);
        setPageNum((p) => Math.min(Math.max(p, 1), doc.numPages));
        setStatus("ready");
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      task?.destroy();
      pdfRef.current = null;
    };
  }, [bookId]);

  const renderPage = useCallback(async () => {
    const pdfjsLib = pdfjsRef.current;
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const textLayerDiv = textLayerRef.current;
    if (!pdfjsLib || !pdf || !canvas || !textLayerDiv) return;

    const myRenderId = ++renderIdRef.current;
    const clamped = Math.min(Math.max(pageNum, 1), pdf.numPages);
    const page = await pdf.getPage(clamped);
    if (myRenderId !== renderIdRef.current) return;

    const viewport = page.getViewport({ scale });
    const context = canvas.getContext("2d");
    if (!context) return;

    const outputScale = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;
    await page.render({ canvas, canvasContext: context, viewport, transform }).promise;
    if (myRenderId !== renderIdRef.current) return;

    textLayerDiv.replaceChildren();
    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.height = `${viewport.height}px`;
    textLayerDiv.style.setProperty("--total-scale-factor", String(scale));
    textLayerDiv.style.setProperty("--scale-factor", String(scale));

    const textContent = await page.getTextContent();
    if (myRenderId !== renderIdRef.current) return;
    const textLayer = new pdfjsLib.TextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport,
    });
    await textLayer.render();
  }, [pageNum, scale]);

  useEffect(() => {
    if (status === "ready") renderPage();
  }, [status, renderPage]);

  useEffect(() => {
    onPageChange(pageNum);
  }, [pageNum, onPageChange]);

  useEffect(() => {
    function handleSelectionChange() {
      const sel = window.getSelection();
      const textLayerDiv = textLayerRef.current;
      const wrap = pageWrapRef.current;
      if (!sel || sel.isCollapsed || !textLayerDiv || !wrap) {
        setSelectionPopover(null);
        return;
      }
      if (!textLayerDiv.contains(sel.anchorNode)) {
        setSelectionPopover(null);
        return;
      }
      const text = sel.toString().trim();
      if (!text) {
        setSelectionPopover(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      setSelectionPopover({
        text,
        x: rect.left - wrapRect.left + rect.width / 2,
        y: rect.top - wrapRect.top,
      });
    }
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  function goToPage(next: number) {
    setSelectionPopover(null);
    setPageNum((p) => {
      const target = Math.min(Math.max(next, 1), numPages || p);
      return target;
    });
  }

  function handleSaveClick() {
    if (!selectionPopover) return;
    onRequestSaveStash({ page: pageNum, excerpt: selectionPopover.text });
    window.getSelection()?.removeAllRanges();
    setSelectionPopover(null);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border bg-surface/60 text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(pageNum - 1)}
            disabled={pageNum <= 1}
            className="px-2 py-1 rounded-md hover:bg-surface-2 disabled:opacity-30"
          >
            ← Prev
          </button>
          <span className="text-muted tabular-nums">
            Page{" "}
            <input
              value={pageNum}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v)) goToPage(v);
              }}
              className="w-12 bg-surface-2 rounded px-1 text-center text-foreground"
            />{" "}
            / {numPages || "…"}
          </span>
          <button
            onClick={() => goToPage(pageNum + 1)}
            disabled={numPages > 0 && pageNum >= numPages}
            className="px-2 py-1 rounded-md hover:bg-surface-2 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - 0.15).toFixed(2)))}
            className="px-2 py-1 rounded-md hover:bg-surface-2"
          >
            −
          </button>
          <span className="text-muted w-10 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + 0.15).toFixed(2)))}
            className="px-2 py-1 rounded-md hover:bg-surface-2"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex justify-center p-6 bg-black/20">
        {status === "error" && (
          <p className="text-red-400 text-sm self-start mt-10">
            Could not load this PDF file.
          </p>
        )}
        {status !== "error" && (
          <div ref={pageWrapRef} className="relative h-fit shadow-2xl">
            <canvas ref={canvasRef} className="block" />
            <div ref={textLayerRef} className="textLayer" />

            {selectionPopover && (
              <button
                onClick={handleSaveClick}
                style={{
                  left: selectionPopover.x,
                  top: selectionPopover.y,
                  transform: "translate(-50%, -120%)",
                }}
                className="absolute z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium shadow-lg whitespace-nowrap hover:brightness-110"
              >
                ✦ Save to Stash
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
