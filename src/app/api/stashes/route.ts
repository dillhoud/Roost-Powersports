import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const q = searchParams.get("q")?.trim() || undefined;

  const where: Prisma.StashWhereInput = {};
  if (bookId) where.bookId = bookId;
  if (tag) where.tags = { some: { tag: { name: tag } } };
  if (q) {
    where.OR = [{ excerpt: { contains: q } }, { note: { contains: q } }];
  }

  const stashes = await prisma.stash.findMany({
    where,
    include: {
      book: { select: { id: true, title: true, author: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(stashes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bookId, page, excerpt, note, color, tags } = body ?? {};

  if (!bookId || typeof page !== "number" || typeof excerpt !== "string" || !excerpt.trim()) {
    return NextResponse.json(
      { error: "bookId, page, and excerpt are required" },
      { status: 400 },
    );
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const tagNames: string[] = Array.isArray(tags)
    ? [...new Set(tags.map((t: unknown) => String(t).trim().toLowerCase()).filter(Boolean))]
    : [];

  const stash = await prisma.stash.create({
    data: {
      bookId,
      page: Math.floor(page),
      excerpt: excerpt.trim(),
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      color: typeof color === "string" && color ? color : "amber",
      tags: {
        create: tagNames.map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } },
        })),
      },
    },
    include: {
      book: { select: { id: true, title: true, author: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(stash, { status: 201 });
}
