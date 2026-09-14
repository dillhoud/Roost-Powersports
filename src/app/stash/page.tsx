import { prisma } from "@/lib/prisma";
import StashFeedClient from "@/components/StashFeedClient";
import type { Stash, TagWithCount } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StashPage() {
  const [stashes, tags] = await Promise.all([
    prisma.stash.findMany({
      include: {
        book: { select: { id: true, title: true, author: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tag.findMany({
      include: { _count: { select: { stashes: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

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

  const serializedTags: TagWithCount[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    _count: t._count,
  }));

  return <StashFeedClient initialStashes={serializedStashes} initialTags={serializedTags} />;
}
