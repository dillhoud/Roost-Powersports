export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const num = (n: number) => n.toLocaleString("en-US");

export function daysUntil(iso: string, now = new Date()) {
  return Math.ceil((new Date(iso + "T23:59:59").getTime() - now.getTime()) / 86_400_000);
}

export function shortDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Params = Record<string, string | string[] | undefined>;

export function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function all(v: string | string[] | undefined) {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

/** Build a query string from params, overriding/removing some keys. */
export function withParams(params: Params, patch: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) for (const x of all(v)) if (x) sp.append(k, x);
  for (const [k, v] of Object.entries(patch)) {
    sp.delete(k);
    if (v) sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
