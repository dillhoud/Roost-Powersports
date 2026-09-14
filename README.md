# Stash

A private library for your own PDF books — upload PDFs, read them in the
browser, and save the passages worth keeping as tagged "stashes" you can
search and browse later (think: a personal, self-hosted Deep Stash for the
books you already own).

Built for one reader, self-hosted on your own hardware. No accounts, no
sign-up, no third-party services — everything (PDFs and the notes you save)
lives in a single SQLite database and an uploads folder on disk.

## Features

- **Library** — upload PDFs, see real first-page cover thumbnails, track
  reading progress per book.
- **Reader** — paginated PDF viewer (zoom, page jump) with selectable text
  rendered directly over the page.
- **Stashing** — select any passage while reading and save it with an
  optional note, tags, and a highlight color.
- **Stash feed** — every saved passage in one searchable, tag-filterable
  feed, linking back to its page in the source book.

Audio read-along (text-to-speech narration synced word-by-word to the page)
is intentionally not in this version — the plan is to layer it on top of the
stash/highlight model once the core library is solid.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + SQLite for storage
- [pdf.js](https://mozilla.github.io/pdf.js/) for in-browser PDF rendering
  and the selectable text layer

## Running locally

```bash
npm install            # also runs prisma generate + copies the pdf.js worker
npx prisma migrate deploy
npm run dev
```

Open <http://localhost:3000>.

By default `DATABASE_URL` in `.env` points at `./data/app.db`. Prisma's CLI
resolves relative SQLite paths relative to `prisma/schema.prisma`, while the
Next.js server resolves them relative to the process's working directory —
these disagree for a relative path, so **use an absolute path** for
`DATABASE_URL` (see `.env.example`) to keep the CLI and the running app
pointed at the same file.

## Self-hosting with Docker (recommended)

```bash
docker compose up -d --build
```

This builds the app, runs pending Prisma migrations on container start, and
serves it on <http://localhost:3000>. Uploaded PDFs and the SQLite database
are stored in a named volume (`stash-data`, mounted at `/app/data`) so they
survive rebuilds and restarts.

To update after pulling new code:

```bash
docker compose up -d --build
```

Migrations run automatically on start, so there's nothing else to do.

### Without Docker

```bash
npm ci
DATABASE_URL="file:/absolute/path/to/data/app.db" npx prisma migrate deploy
DATABASE_URL="file:/absolute/path/to/data/app.db" npm run build
DATABASE_URL="file:/absolute/path/to/data/app.db" npm run start -- -p 3000
```

Put the app behind a reverse proxy (Caddy, nginx, Tailscale, etc.) if you
want it reachable outside your own machine/network — there's no built-in
authentication, since this is meant for a single trusted user.

## Data & backups

Everything that matters lives under `data/` (or the `stash-data` Docker
volume): `data/app.db` (SQLite database) and `data/uploads/` (the PDF
files). Back up that one directory and you have your whole library.

## Project layout

- `src/app` — routes and API handlers (`/api/books`, `/api/stashes`, `/api/tags`)
- `src/components` — the PDF viewer, upload UI, stash cards/dialogs
- `src/lib` — Prisma client, storage helpers, server-side PDF metadata
  extraction, and the client-side lazy pdf.js loader
- `prisma/schema.prisma` — data model (`Book`, `Stash`, `Tag`)
