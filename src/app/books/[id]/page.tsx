import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReaderClient from "@/components/ReaderClient";
import type { BookSummary, Stash } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;

  const book = await prisma.book.findUnique({
    where: { id },
    include: { _count: { select: { stashes: true } } },
  });
  if (!book) notFound();

  const stashes = await prisma.stash.findMany({
    where: { bookId: id },
    include: {
      book: { select: { id: true, title: true, author: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { page: "asc" },
  });

  const allTags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  const serializedBook: BookSummary = {
    id: book.id,
    title: book.title,
    author: book.author,
    filename: book.filename,
    fileSize: book.fileSize,
    pageCount: book.pageCount,
    createdAt: book.createdAt.toISOString(),
    lastOpenedAt: book.lastOpenedAt ? book.lastOpenedAt.toISOString() : null,
    lastPage: book.lastPage,
    _count: book._count,
  };

  const serializedStashes: Stash[] = stashes.map((s) => ({
    id: s.id,
    bookId: s.bookId,
    page: s.page,
    excerpt: s.excerpt,
    note: s.note,
    color: s.color,
    createdAt: s.createdAt.toISOString(),
    book: s.book,
    tags: s.tags.map((t) => ({ tag: { id: t.tag.id, name: t.tag.name } })),
  }));

  const initialPage = page ? parseInt(page, 10) || book.lastPage || 1 : book.lastPage || 1;

  return (
    <ReaderClient
      book={serializedBook}
      initialStashes={serializedStashes}
      initialTagNames={allTags.map((t) => t.name)}
      initialPage={initialPage}
    />
  );
}
