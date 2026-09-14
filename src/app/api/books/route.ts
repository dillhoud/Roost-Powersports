import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { ensureUploadsDir, uploadPath } from "@/lib/storage";
import { readPdfMetadata } from "@/lib/pdf-server";

export async function GET() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { stashes: true } } },
  });
  return NextResponse.json(books);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let pageCount: number | undefined;
  let extractedTitle: string | undefined;
  let extractedAuthor: string | undefined;
  try {
    const meta = await readPdfMetadata(buffer);
    pageCount = meta.pageCount;
    extractedTitle = meta.title;
    extractedAuthor = meta.author;
  } catch (err) {
    console.error("Failed to read PDF metadata", err);
  }

  await ensureUploadsDir();
  const filename = `${randomUUID()}.pdf`;
  await writeFile(uploadPath(filename), buffer);

  const fallbackTitle = file.name
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

  const book = await prisma.book.create({
    data: {
      title: extractedTitle || fallbackTitle || "Untitled",
      author: extractedAuthor,
      filename,
      fileSize: buffer.byteLength,
      pageCount,
    },
  });

  return NextResponse.json(book, { status: 201 });
}
