import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { uploadPath } from "@/lib/storage";

function asciiFilename(title: string) {
  const ascii = title.replace(/[^\x20-\x7E]/g, "").replace(/["\\]/g, "");
  return ascii.trim() || "book";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = uploadPath(book.filename);
  const stats = await stat(filePath).catch(() => null);
  if (!stats) return NextResponse.json({ error: "File missing on disk" }, { status: 404 });

  const range = req.headers.get("range");
  const baseHeaders = {
    "Content-Type": "application/pdf",
    "Accept-Ranges": "bytes",
    "Content-Disposition": `inline; filename="${asciiFilename(book.title)}.pdf"`,
    "Cache-Control": "private, max-age=3600",
  };

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? parseInt(match[1], 10) : 0;
    const end = match?.[2] ? parseInt(match[2], 10) : stats.size - 1;
    const safeEnd = Math.min(end, stats.size - 1);
    const chunkSize = safeEnd - start + 1;

    const stream = createReadStream(filePath, { start, end: safeEnd });
    return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${safeEnd}/${stats.size}`,
        "Content-Length": String(chunkSize),
      },
    });
  }

  const stream = createReadStream(filePath);
  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers: {
      ...baseHeaders,
      "Content-Length": String(stats.size),
    },
  });
}
