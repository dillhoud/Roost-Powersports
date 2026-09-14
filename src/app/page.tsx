import { prisma } from "@/lib/prisma";
import LibraryClient from "@/components/LibraryClient";
import type { BookSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { stashes: true } } },
  });

  const serialized: BookSummary[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    filename: b.filename,
    fileSize: b.fileSize,
    pageCount: b.pageCount,
    createdAt: b.createdAt.toISOString(),
    lastOpenedAt: b.lastOpenedAt ? b.lastOpenedAt.toISOString() : null,
    lastPage: b.lastPage,
    _count: b._count,
  }));

  return <LibraryClient initialBooks={serialized} />;
}
