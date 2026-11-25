"use client";

import { useId, useState } from "react";
import { CREDIT_TIERS, DEFAULT_DOWN_PCT, DEFAULT_TERM, TERMS, monthlyPayment, salesTaxFor, type PromoRate } from "@/lib/finance";
import { cad } from "@/lib/format";

interface Props {
  price: number;
  condition: "new" | "used";
  /** Whether the dealer offers financing. */
  financing: boolean;
  /** Two-letter province or territory code, for the default sales tax. */
  province: string;
  promo?: PromoRate;
}

export function PaymentCalculator({ price, condition, financing, province, promo }: Props) {
  const id = useId();
  const promoEligible = !!promo && condition === "new" && financing;
  const defaultFees = condition === "new" ? 1500 : 400;
  const tax = salesTaxFor(province);

  const [down, setDown] = useState(Math.round((price * DEFAULT_DOWN_PCT) / 100) * 100);
  const [tier, setTier] = useState<string>(CREDIT_TIERS[1].id);
  const [usePromo, setUsePromo] = useState(promoEligible);
  const [term, setTerm] = useState<number>(promoEligible && promo?.months ? promo.months : DEFAULT_TERM);
  const [taxPct, setTaxPct] = useState(tax.pct);
  const [fees, setFees] = useState(defaultFees);

  const standardApr = CREDIT_TIERS.find((t) => t.id === tier)!.apr;
  const promoActive = promoEligible && usePromo;
  const apr = promoActive ? promo!.apr : standardApr;

  const outTheDoor = price + fees + (price * taxPct) / 100;
  const safeDown = Math.min(Math.max(down, 0), outTheDoor);
  const financed = outTheDoor - safeDown;
  const payment = monthlyPayment(financed, apr, term);
  const interest = payment * term - financed;
  const standardPayment = monthlyPayment(financed, standardApr, term);
  const promoSavings = promoActive ? (standardPayment - payment) * term : 0;
  const promoTermTooLong = promoActive && promo?.months !== undefined && term > promo.months;

  return (
    <div className="card p-5 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-bold">Payment calculator</h2>
        <span className="text-xs text-zinc-500">Estimate only</span>
      </div>

      <div className="mt-3 rounded-sm bg-carbon-950 p-4 text-center">
        <div className="font-display text-4xl font-bold italic tabular-nums text-white">
          {cad(Math.round(payment))}<span className="text-lg text-zinc-500">/mo</span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {term} months at {apr.toFixed(2)}% APR{promoActive && <span className="font-semibold text-emerald-400"> · promo rate</span>}
        </div>
      </div>

      {promoEligible && (
        <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-sm border border-emerald-500/30 bg-emerald-500/10 p-3">
          <input type="checkbox" checked={usePromo} onChange={(e) => setUsePromo(e.target.checked)} className="mt-0.5 accent-emerald-500" />
          <span>
            <span className="font-semibold text-emerald-300">Use {promo!.make} promo: {promo!.apr}% APR</span>
            {promo!.months && <span className="text-zinc-400"> up to {promo!.months} mo</span>}
            <span className="block text-xs text-zinc-500">{promo!.title} · approved credit · confirm with the dealer</span>
          </span>
        </label>
      )}
      {!promoEligible && promo && (
        <p className="mt-3 text-xs text-zinc-500">
          {promo.make} has {promo.apr}% promo financing,{" "}
          {condition === "new" ? "but it's arranged through the dealer and this one doesn't list financing." : "but factory rates usually apply only to new units."}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <div>
          <label className="label" htmlFor={`${id}-down`}>Down payment</label>
          <div className="grid grid-cols-[1fr_110px] items-center gap-3">
            <input
              type="range"
              min={0}
              max={Math.round(price / 100) * 100}
              step={100}
              value={Math.min(down, price)}
              onChange={(e) => setDown(Number(e.target.value))}
              aria-label="Down payment slider"
              className="accent-brand-500"
            />
            <input id={`${id}-down`} type="number" min={0} step={100} value={down} onChange={(e) => setDown(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor={`${id}-term`}>Term</label>
            <select id={`${id}-term`} value={term} onChange={(e) => setTerm(Number(e.target.value))} className="field">
              {TERMS.map((t) => <option key={t} value={t}>{t} months</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`${id}-credit`}>Credit</label>
            <select id={`${id}-credit`} value={tier} onChange={(e) => setTier(e.target.value)} className="field">
              {CREDIT_TIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`${id}-tax`}>{province} {tax.label} %</label>
            <input id={`${id}-tax`} type="number" min={0} max={15} step={0.25} value={taxPct} onChange={(e) => setTaxPct(Number(e.target.value) || 0)} className="field" />
          </div>
          <div>
            <label className="label" htmlFor={`${id}-fees`}>{condition === "new" ? "Freight, PDI & fees" : "Dealer fees"}</label>
            <input id={`${id}-fees`} type="number" min={0} step={50} value={fees} onChange={(e) => setFees(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        {promoTermTooLong && (
          <p className="text-xs text-amber-300">The promo rate is offered up to {promo!.months} months. Longer terms usually get a standard rate.</p>
        )}
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-carbon-800 pt-4">
        <Row k="Price" v={cad(price)} />
        <Row k={`Tax + fees`} v={cad(Math.round(outTheDoor - price))} />
        <Row k="Down payment" v={`− ${cad(Math.round(safeDown))}`} />
        <Row k="Amount financed" v={cad(Math.round(financed))} strong />
        <Row k="Total interest" v={cad(Math.round(Math.max(interest, 0)))} />
        {promoSavings > 0 && <Row k="Saved vs. standard rate" v={cad(Math.round(promoSavings))} accent />}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-zinc-600">
        {condition === "new" && "New units usually carry freight and PDI charges, so ask for an all-in price. "}
        {!financing && "This dealer doesn't list in-house financing, so this is what a bank or credit union loan might cost. "}
        Rates are typical ranges for powersports loans, not an offer of credit.
      </p>
    </div>
  );
}

function Row({ k, v, strong, accent }: { k: string; v: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500">{k}</dt>
      <dd className={accent ? "font-semibold text-emerald-400" : strong ? "font-bold text-white" : "font-semibold"}>{v}</dd>
    </div>
  );
}
