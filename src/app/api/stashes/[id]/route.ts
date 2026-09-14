import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.stash.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (Array.isArray(body.tags)) {
    const tagNames = [
      ...new Set(
        (body.tags as unknown[]).map((t) => String(t).trim().toLowerCase()).filter(Boolean),
      ),
    ];
    await prisma.tagsOnStashes.deleteMany({ where: { stashId: id } });
    await prisma.stash.update({
      where: { id },
      data: {
        tags: {
          create: tagNames.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
    });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.note === "string") data.note = body.note.trim() || null;
  if (typeof body.color === "string" && body.color) data.color = body.color;

  const stash = await prisma.stash.update({
    where: { id },
    data,
    include: {
      book: { select: { id: true, title: true, author: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(stash);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.stash.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.stash.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
