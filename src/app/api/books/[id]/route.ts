import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { uploadPath } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: { _count: { select: { stashes: true } } },
  });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(book);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof body.lastPage === "number" && body.lastPage > 0) {
    data.lastPage = Math.floor(body.lastPage);
  }
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (typeof body.author === "string") {
    data.author = body.author.trim() || null;
  }
  if (body.touch) {
    data.lastOpenedAt = new Date();
  }

  const book = await prisma.book.update({ where: { id }, data });
  return NextResponse.json(book);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.book.delete({ where: { id } });
  await unlink(uploadPath(book.filename)).catch(() => {});

  return NextResponse.json({ ok: true });
}
