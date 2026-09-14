import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function readPdfMetadata(buffer: Buffer) {
  const data = new Uint8Array(buffer);
  const doc = await getDocument({ data }).promise;
  try {
    const pageCount = doc.numPages;
    const meta = await doc.getMetadata().catch(() => null);
    const info = (meta?.info ?? {}) as Record<string, unknown>;
    const title = typeof info.Title === "string" && info.Title.trim() ? info.Title.trim() : undefined;
    const author = typeof info.Author === "string" && info.Author.trim() ? info.Author.trim() : undefined;
    return { pageCount, title, author };
  } finally {
    doc.cleanup?.();
  }
}
