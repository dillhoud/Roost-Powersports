export interface BookSummary {
  id: string;
  title: string;
  author: string | null;
  filename: string;
  fileSize: number;
  pageCount: number | null;
  createdAt: string;
  lastOpenedAt: string | null;
  lastPage: number;
  _count: { stashes: number };
}

export interface TagRef {
  id: string;
  name: string;
}

export interface Stash {
  id: string;
  bookId: string;
  page: number;
  excerpt: string;
  note: string | null;
  color: string;
  createdAt: string;
  book: { id: string; title: string; author: string | null };
  tags: { tag: TagRef }[];
}

export interface TagWithCount extends TagRef {
  _count: { stashes: number };
}

export const STASH_COLORS = [
  "amber",
  "rose",
  "emerald",
  "sky",
  "violet",
] as const;

export type StashColor = (typeof STASH_COLORS)[number];
