import Link from "next/link";
import { getModel } from "@/data/catalog";
import { hasDb, prisma } from "@/lib/db";
import { daysUntil, shortDate } from "@/lib/format";
import { loadStarter } from "../actions";

const DAY = 86_400_000;

export default async function AdminHome() {
  if (!hasDb) return <SetupDatabase />;

  const now = new Date();
  const today = new Date(now.toISOString().slice(0, 10));
  const stale = new Date(now.getTime() - 30 * DAY);
  const soon = new Date(today.getTime() + 14 * DAY);

  const [issues, drafts, issuesUnchecked, promosLive, promosExpired, promosUnchecked, ending, uncheckedIssues] = await Promise.all([
    prisma.issue.count({ where: { published: true } }),
    prisma.issue.count({ where: { published: false } }),
    prisma.issue.count({ where: { OR: [{ lastVerified: null }, { lastVerified: { lt: stale } }] } }),
    prisma.promo.count({ where: { published: true, ends: { gte: today } } }),
    prisma.promo.count({ where: { ends: { lt: today } } }),
    prisma.promo.count({ where: { ends: { gte: today }, OR: [{ lastVerified: null }, { lastVerified: { lt: stale } }] } }),
    prisma.promo.findMany({ where: { published: true, ends: { gte: today, lte: soon } }, orderBy: { ends: "asc" } }),
    prisma.issue.findMany({ where: { published: true, lastVerified: null }, orderBy: { mentions: "desc" }, take: 6 }),
  ]);

  const [changedPages, sourceCount] = await Promise.all([
    prisma.offerSource.findMany({ where: { needsReview: true }, orderBy: { lastChangedAt: "desc" } }),
    prisma.offerSource.count(),
  ]);

  const empty = issues + drafts === 0 && promosLive + promosExpired + promosUnchecked === 0 && (await prisma.promo.count()) === 0;

  return (
    <div className="space-y-10">
      {empty && (
        <form action={loadStarter} className="card flex flex-wrap items-center justify-between gap-4 border-brand-500/40 p-5">
          <p className="text-sm text-zinc-300">
            The database is empty. Load the starter issues and deals the site has been showing so you can edit them here?
          </p>
          <button className="btn-primary">Load starter content</button>
        </form>
      )}
      <div>
        <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">What&apos;s live on the site and what needs a look.</p>
      </div>

      {changedPages.length > 0 ? (
        <Link href="/admin/sources" className="card block border-amber-500/40 bg-amber-500/5 p-5 transition hover:border-amber-400">
          <div className="font-semibold text-amber-300">
            {changedPages.length} offer page{changedPages.length > 1 ? "s" : ""} changed: {changedPages.map((p) => p.make).join(", ")}
          </div>
          <p className="mt-1 text-sm text-zinc-400">Check whether offers were added, changed or ended, update your deals, then mark the page reviewed. →</p>
        </Link>
      ) : sourceCount === 0 ? (
        <Link href="/admin/sources" className="card block p-5 transition hover:border-brand-500">
          <div className="font-semibold text-white">Keep deals up to date automatically</div>
          <p className="mt-1 text-sm text-zinc-400">Add each brand&apos;s offers page and the site will check it every morning and tell you when it changes. →</p>
        </Link>
      ) : null}

      <div className="grid gap-px overflow-hidden rounded-sm border border-carbon-800 bg-carbon-800 sm:grid-cols-3 lg:grid-cols-6">
        <Stat n={issues} label="Issues live" href="/admin/issues" />
        <Stat n={drafts} label="Issue drafts" href="/admin/issues?status=draft" />
        <Stat n={issuesUnchecked} label="Issues to check" href="/admin/issues?status=unchecked" warn />
        <Stat n={promosLive} label="Deals live" href="/admin/deals" />
        <Stat n={promosUnchecked} label="Deals to check" href="/admin/deals?status=unchecked" warn />
        <Stat n={promosExpired} label="Expired deals" href="/admin/deals?status=expired" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Deals ending in the next 14 days" empty="Nothing ending soon.">
          {ending.map((p) => (
            <Row key={p.id} href={`/admin/deals/${p.id}`} title={`${p.make} · ${p.title}`} meta={`Ends ${shortDate(p.ends.toISOString().slice(0, 10))} · ${daysUntil(p.ends.toISOString().slice(0, 10))}d left`} />
          ))}
        </Panel>
        <Panel title="Most-discussed issues never checked" empty="All live issues have been checked.">
          {uncheckedIssues.map((i) => {
            const m = getModel(i.modelSlug);
            return <Row key={i.id} href={`/admin/issues/${i.id}`} title={i.title} meta={`${m ? `${m.make} ${m.model}` : i.modelSlug} · ~${i.mentions} threads`} />;
          })}
        </Panel>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/issues/new" className="btn-primary">Add an issue</Link>
        <Link href="/admin/deals/new" className="btn-ghost">Add a deal</Link>
      </div>
    </div>
  );
}

function Stat({ n, label, href, warn }: { n: number; label: string; href: string; warn?: boolean }) {
  return (
    <Link href={href} className="bg-carbon-900 p-5 transition hover:bg-carbon-850">
      <div className={`font-display text-4xl font-bold italic tabular-nums ${warn && n > 0 ? "text-amber-400" : "text-white"}`}>{n}</div>
      <div className="eyebrow mt-1 text-zinc-500">{label}</div>
    </Link>
  );
}

function Panel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold text-white">{title}</h2>
      {children.length ? <ul className="mt-3 divide-y divide-carbon-800">{children}</ul> : <p className="mt-3 text-sm text-zinc-500">{empty}</p>}
    </section>
  );
}

function Row({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 py-3 hover:text-brand-400">
        <span className="min-w-0 truncate text-sm font-medium text-zinc-200">{title}</span>
        <span className="shrink-0 text-xs text-zinc-500">{meta}</span>
      </Link>
    </li>
  );
}

function SetupDatabase() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl font-bold uppercase italic tracking-tight text-white">Connect a database</h1>
      <p className="mt-3 text-zinc-400">
        You&apos;re logged in, but there&apos;s no database yet, so the site is showing its built-in sample data and nothing here can be edited.
      </p>
      <ol className="card mt-6 list-decimal space-y-3 p-6 pl-10 text-sm text-zinc-300">
        <li>In Vercel, open this project → <b className="text-white">Storage</b> → <b className="text-white">Create Database</b> → choose <b className="text-white">Neon (Postgres)</b> → free plan → connect it to this project.</li>
        <li>Go to <b className="text-white">Deployments</b> and <b className="text-white">Redeploy</b>. The tables are created automatically during the build.</li>
        <li>Come back to this page and click <b className="text-white">Load starter content</b> to copy the current issues and deals into the database.</li>
      </ol>
    </div>
  );
}
