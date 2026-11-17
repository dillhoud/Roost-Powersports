import type { Metadata } from "next";
import Link from "next/link";
import { CATALOG, CATEGORIES, categoryLabel, getModel, type VehicleModel } from "@/data/catalog";
import { getIssues } from "@/lib/content";
import { CURRENT_YEAR, allListings, estimateMarketValue, expectedUsagePerYear, rateDeal, usageUnit } from "@/lib/listings";
import { first, num, cad } from "@/lib/format";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { DealBadge, DealMeter } from "@/components/DealBadge";
import { ListingCard } from "@/components/ListingCard";
import { yearInRange } from "@/components/IssueCard";

export const metadata: Metadata = {
  title: "What's my machine worth?",
  description: "Free Canadian value estimate for your ATV, side-by-side, snowmobile or motorcycle: trade-in, private-party and dealer retail.",
};

type SP = Record<string, string | string[] | undefined>;

const round50 = (n: number) => Math.round(n / 50) * 50;
const lastYear = (m: VehicleModel) => Math.min(m.years[1], CURRENT_YEAR);

export default async function ValuePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const m = getModel(first(sp.model) ?? "");
  const yearIn = Number(first(sp.year));
  const year = m ? Math.min(Math.max(yearIn ? Math.round(yearIn) : lastYear(m) - 3, m.years[0]), lastYear(m)) : undefined;
  const age = year !== undefined ? Math.max(CURRENT_YEAR - year, 0.5) : 0;
  const typicalUsage = m ? Math.round(expectedUsagePerYear(m.category) * age) : 0;
  const usageIn = first(sp.usage);
  const usage = m ? (usageIn !== undefined && usageIn !== "" && Number(usageIn) >= 0 ? Math.round(Number(usageIn)) : typicalUsage) : 0;
  const askIn = Number(first(sp.price));
  const ask = askIn > 0 ? Math.round(askIn) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="eyebrow text-brand-400">Free · no sign-up</div>
      <h1 className="display mt-3 text-5xl text-white md:text-6xl">What&apos;s my machine worth?</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">
        Pick your model, year and {m ? (usageUnit(m.category) === "hrs" ? "hours" : "kilometres") : "hours or kilometres"}. You get a trade-in, private-party and
        dealer retail estimate from the same model we use to rate every listing on Roost.
      </p>

      <AutoSubmitForm className="card mt-8 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
        <div>
          <label className="label" htmlFor="model">Model</label>
          <select id="model" name="model" defaultValue={m?.slug ?? ""} className="field" required>
            <option value="">Choose a model…</option>
            {CATEGORIES.map((c) => (
              <optgroup key={c.id} label={c.plural}>
                {CATALOG.filter((x) => x.category === c.id).map((x) => (
                  <option key={x.slug} value={x.slug}>{x.make} {x.model}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="year">Year</label>
          <input
            id="year" name="year" type="number"
            min={m?.years[0]} max={m ? lastYear(m) : CURRENT_YEAR}
            defaultValue={year} key={`y-${m?.slug}`}
            placeholder={m ? `${m.years[0]}–${lastYear(m)}` : "Year"}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="usage">{m && usageUnit(m.category) === "km" ? "Kilometres" : "Hours / km"}</label>
          <input id="usage" name="usage" type="number" min={0} defaultValue={m ? usage : undefined} key={`u-${m?.slug}`} placeholder={m ? `Typical: ${num(typicalUsage)}` : ""} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="price">Checking a price? <span className="normal-case tracking-normal text-zinc-600">(optional)</span></label>
          <input id="price" name="price" type="number" min={0} step={100} defaultValue={ask} placeholder="Asking or offer $" className="field" />
        </div>
        <button className="btn-primary h-[38px]">Get value</button>
      </AutoSubmitForm>

      <div className="transition-opacity [[data-pending]_&]:opacity-50">
        {m && year !== undefined ? <Result m={m} year={year} usage={usage} typicalUsage={typicalUsage} ask={ask} /> : <Popular />}
      </div>
    </div>
  );
}

async function Result({ m, year, usage, typicalUsage, ask }: { m: VehicleModel; year: number; usage: number; typicalUsage: number; ask?: number }) {
  const unit = usageUnit(m.category);
  const privateParty = estimateMarketValue(m, year, usage, "used");
  const tradeIn = round50(privateParty * 0.8);
  const retail = round50(privateParty * 1.1);
  const low = round50(privateParty * 0.93);
  const high = round50(privateParty * 1.07);
  const nextYear = round50(privateParty * (1 - m.depreciation));

  const usageSteps = [0.5, 1, 1.8].map((f) => {
    const u = Math.round((typicalUsage * f) / (unit === "hrs" ? 5 : 100)) * (unit === "hrs" ? 5 : 100);
    return { label: f < 1 ? "Low use" : f > 1 ? "High use" : "Typical", usage: u, value: estimateMarketValue(m, year, u, "used") };
  });

  const comps = allListings()
    .filter((l) => l.modelSlug === m.slug && l.condition === "used" && Math.abs(l.year - year) <= 2)
    .sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year) || Math.abs(a.usage - usage) - Math.abs(b.usage - usage));
  const compAvg = comps.length ? Math.round(comps.reduce((s, l) => s + l.price, 0) / comps.length) : 0;

  const issues = (await getIssues(m.slug)).filter((i) => yearInRange(i.years, year));
  const majors = issues.filter((i) => i.severity === "major" || i.kind === "recall");

  const peers = CATALOG.filter((x) => x.category === m.category);
  const avgDep = peers.reduce((s, x) => s + x.depreciation, 0) / peers.length;
  const holds = m.depreciation < avgDep - 0.005 ? "better than" : m.depreciation > avgDep + 0.005 ? "worse than" : "about the same as";

  return (
    <div className="mt-8 space-y-6">
      <section className="card overflow-hidden">
        <div className="border-b border-carbon-800 p-6">
          <div className="text-sm text-zinc-500">{categoryLabel(m.category)} · {m.segment}</div>
          <h2 className="font-display text-3xl font-bold uppercase italic tracking-tight text-white">
            {year} {m.make} {m.model} <span className="text-zinc-500">· {num(usage)} {unit}</span>
          </h2>
        </div>
        <div className="grid gap-px bg-carbon-800 sm:grid-cols-3">
          <ValueTile label="Trade-in" value={tradeIn} note="What a dealer will likely offer. They need room to recondition and resell." />
          <ValueTile label="Private party" value={privateParty} note={`Selling it yourself. Most sell between ${cad(low)} and ${cad(high)}.`} highlight />
          <ValueTile label="Dealer retail" value={retail} note="What a dealer would typically ask for one like it." />
        </div>
      </section>

      {ask !== undefined && (
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Checking {cad(ask)}</h2>
            <DealBadge deal={rateDeal(ask, privateParty)} size="lg" />
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            {ask <= privateParty
              ? <>That&apos;s <b>{cad(privateParty - ask)} below</b> the private-party value. Good for a buyer, low for a seller.</>
              : <>That&apos;s <b>{cad(ask - privateParty)} above</b> the private-party value. Expect buyers to negotiate unless it has extras or recent work.</>}
          </p>
          <div className="mt-4 max-w-xl"><DealMeter price={ask} market={privateParty} /></div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 text-sm">
          <h2 className="font-bold">How {unit === "hrs" ? "hours" : "kilometres"} change the value</h2>
          <p className="mt-1 text-zinc-500">A typical {year} has about {num(typicalUsage)} {unit}.</p>
          <ul className="mt-4 space-y-2">
            {usageSteps.map((s) => (
              <li key={s.label} className="flex justify-between">
                <span className="text-zinc-400">{s.label} <span className="text-zinc-600">· {num(s.usage)} {unit}</span></span>
                <span className="font-semibold">{cad(s.value)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6 text-sm">
          <h2 className="font-bold">Holding its value</h2>
          <p className="mt-3 text-zinc-400">
            The {m.model} loses about <b className="text-white">{Math.round(m.depreciation * 100)}% a year</b>, {holds} the average {categoryLabel(m.category).toLowerCase()}.
          </p>
          <div className="mt-4 flex justify-between border-t border-carbon-800 pt-3">
            <span className="text-zinc-500">Estimated a year from now</span>
            <span className="font-semibold">{cad(nextYear)}</span>
          </div>
          <p className="mt-1 text-xs text-zinc-600">At similar use. Selling before the riding season usually helps.</p>
        </section>

        <section className="card p-6 text-sm">
          <h2 className="font-bold">What buyers will ask about</h2>
          {issues.length ? (
            <>
              <p className="mt-1 text-zinc-500">{issues.length} known issue{issues.length > 1 ? "s" : ""} for {year}{majors.length ? `, ${majors.length} serious` : ""}. Receipts showing they&apos;re fixed help you get the top of the range.</p>
              <ul className="mt-3 space-y-1.5">
                {issues.slice(0, 4).map((i) => <li key={i.id} className="text-zinc-300">• {i.title}</li>)}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-zinc-500">No known issues tracked for this year.</p>
          )}
          <Link href={`/research/${m.slug}#issues`} className="mt-4 inline-block font-semibold text-brand-400 hover:underline">Full model report →</Link>
        </section>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-3xl font-bold uppercase italic tracking-tight text-white">Similar ones for sale</h2>
          {comps.length > 0 && (
            <span className="text-sm text-zinc-500">{comps.length} used {year - 2}–{year + 2} listings · average asking {cad(compAvg)}</span>
          )}
        </div>
        {comps.length ? (
          <div className="space-y-3">{comps.slice(0, 4).map((l) => <ListingCard key={l.id} l={l} />)}</div>
        ) : (
          <div className="card p-8 text-center text-zinc-500">No similar used listings right now.</div>
        )}
        {comps.length > 4 && (
          <Link href={`/listings?model=${m.slug}&condition=used&minYear=${year - 2}&maxYear=${year + 2}`} className="btn-ghost mt-4">See all {comps.length}</Link>
        )}
      </section>

      <p className="text-xs leading-relaxed text-zinc-600">
        Estimates come from MSRP, the model&apos;s typical depreciation, age and {unit === "hrs" ? "hours" : "kilometres"} compared with normal use. They don&apos;t
        account for condition, accessories, title status or local demand. Get an inspection and compare local listings before you buy or sell.
      </p>
    </div>
  );
}

function ValueTile({ label, value, note, highlight }: { label: string; value: number; note: string; highlight?: boolean }) {
  return (
    <div className={`p-6 ${highlight ? "bg-carbon-850" : "bg-carbon-900"}`}>
      <div className={`eyebrow ${highlight ? "text-brand-400" : "text-zinc-500"}`}>{label}</div>
      <div className="mt-2 font-display text-5xl font-bold italic tabular-nums text-white">{cad(value)}</div>
      <p className="mt-2 text-sm text-zinc-500">{note}</p>
    </div>
  );
}

function Popular() {
  const picks = ["polaris-rzr-xp-1000", "canam-maverick-x3", "yamaha-grizzly-eps", "skidoo-summit-x", "polaris-sportsman-570", "yamaha-tenere-700"]
    .map((s) => getModel(s))
    .filter((x): x is VehicleModel => !!x);
  return (
    <section className="mt-10">
      <h2 className="eyebrow text-zinc-500">Popular lookups</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {picks.map((x) => (
          <Link key={x.slug} href={`/value?model=${x.slug}`} className="chip px-3 py-1.5 text-sm hover:border-brand-500 hover:text-white">
            {x.make} {x.model}
          </Link>
        ))}
      </div>
    </section>
  );
}
