// Shared client / buy-box helpers. Safe to import from client components.

import {
  MARKET_LABELS,
  formatMoney,
  type Market,
} from "@/lib/listings";

export const WEEK_STATUSES = [
  "New",
  "CarriedOver",
  "Updated",
  "Passed",
] as const;
export type WeekStatus = (typeof WEEK_STATUSES)[number];

export const WEEK_STATUS_LABELS: Record<WeekStatus, string> = {
  New: "New",
  CarriedOver: "Carried over",
  Updated: "Updated",
  Passed: "Passed",
};

export const WEEK_STATUS_BADGE: Record<WeekStatus, string> = {
  New: "bg-[#edf1f7] text-[#264a72] ring-1 ring-inset ring-[#264a72]/20",
  CarriedOver: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15",
  Updated: "bg-[#f4eede] text-[#7a5a2c] ring-1 ring-inset ring-[#7a5a2c]/20",
  Passed: "bg-[#f3e7e3] text-[#834a39] ring-1 ring-inset ring-[#834a39]/20",
};

export function isWeekStatus(v: unknown): v is WeekStatus {
  return (
    typeof v === "string" && (WEEK_STATUSES as readonly string[]).includes(v)
  );
}

/** The buy-box fields we match on. */
export type BuyBox = {
  buyBoxMarkets: Market[];
  buyBoxPriceMin: number | null;
  buyBoxPriceMax: number | null;
  buyBoxCapRateMin: number | null;
  buyBoxUnitMin: number | null;
  buyBoxUnitMax: number | null;
};

/** The listing fields we match against. */
export type MatchableListing = {
  market: Market;
  askingPrice: number | null;
  capRate: number | null;
  unitCount: number | null;
};

/**
 * Does a listing fit a client's buy box?
 *
 * Rules: an unset criterion is ignored. When a criterion IS set but the
 * listing is missing that value (e.g. price filter set, listing has no price),
 * it does not match — we only surface listings we can actually vouch for.
 */
export function listingMatchesBuyBox(
  listing: MatchableListing,
  box: BuyBox,
): boolean {
  if (
    box.buyBoxMarkets.length > 0 &&
    !box.buyBoxMarkets.includes(listing.market)
  ) {
    return false;
  }

  if (box.buyBoxPriceMin != null) {
    if (listing.askingPrice == null || listing.askingPrice < box.buyBoxPriceMin) {
      return false;
    }
  }
  if (box.buyBoxPriceMax != null) {
    if (listing.askingPrice == null || listing.askingPrice > box.buyBoxPriceMax) {
      return false;
    }
  }

  if (box.buyBoxCapRateMin != null) {
    if (listing.capRate == null || listing.capRate < box.buyBoxCapRateMin) {
      return false;
    }
  }

  if (box.buyBoxUnitMin != null) {
    if (listing.unitCount == null || listing.unitCount < box.buyBoxUnitMin) {
      return false;
    }
  }
  if (box.buyBoxUnitMax != null) {
    if (listing.unitCount == null || listing.unitCount > box.buyBoxUnitMax) {
      return false;
    }
  }

  return true;
}

/** One-line human summary of a buy box for the client list. */
export function buyBoxSummary(box: BuyBox): string {
  const parts: string[] = [];

  parts.push(
    box.buyBoxMarkets.length
      ? box.buyBoxMarkets.map((m) => MARKET_LABELS[m]).join(", ")
      : "Any market",
  );

  const price = rangeText(
    box.buyBoxPriceMin,
    box.buyBoxPriceMax,
    (n) => formatMoney(n),
  );
  if (price) parts.push(price);

  if (box.buyBoxCapRateMin != null) {
    parts.push(`cap ≥ ${box.buyBoxCapRateMin.toFixed(2)}%`);
  }

  const units = rangeText(
    box.buyBoxUnitMin,
    box.buyBoxUnitMax,
    (n) => `${n}`,
    "units",
  );
  if (units) parts.push(units);

  return parts.join(" · ");
}

function rangeText(
  min: number | null,
  max: number | null,
  fmt: (n: number) => string,
  suffix = "",
): string | null {
  const tail = suffix ? ` ${suffix}` : "";
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}${tail}`;
  if (min != null) return `≥ ${fmt(min)}${tail}`;
  if (max != null) return `≤ ${fmt(max)}${tail}`;
  return null;
}

/** Client-facing share path. Prepend the origin for an absolute URL. */
export function sharePath(token: string): string {
  return `/share/${token}`;
}
