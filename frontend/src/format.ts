import type { PriceSource } from "./types";

/** Integer cents to "$12.34". Money stays in cents everywhere else. */
export function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  return `${sign}$${dollars}.${String(abs % 100).padStart(2, "0")}`;
}

/** "$60" for whole-dollar goal prices, otherwise full cents. */
export function moneyShort(cents: number): string {
  return cents % 100 === 0 ? `$${(cents / 100).toLocaleString("en-US")}` : money(cents);
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** "Kroger, Ann Arbor, MI · sample prices · Oct 28, 2026" (without the kind if `withKind` is false) */
export function priceLabel(source: PriceSource, withKind = true): string {
  const date = new Date(`${source.fetched_at}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const kind = source.is_sample ? "sample prices" : "live prices";
  return withKind
    ? `${source.store}, ${source.location} · ${kind} · ${date}`
    : `${source.store}, ${source.location} · ${date}`;
}

/** Weeks left to reach a goal at the current weekly savings, or null if not saving. */
export function weeksToGoal(goalCents: number, bankedCents: number, weeklyCents: number) {
  const remaining = goalCents - bankedCents;
  if (remaining <= 0) return 0;
  if (weeklyCents <= 0) return null;
  return Math.ceil(remaining / weeklyCents);
}
