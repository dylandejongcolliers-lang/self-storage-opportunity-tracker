// Shared client / buy-box helpers. Safe to import from client components.

import { formatMoney } from "@/lib/listings";

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

/** A rotating set of tag colors, one per client — picked deterministically
 *  from the client's id so the same client always gets the same color
 *  everywhere, with no color field to manage. Avoids amber/red/slate, which
 *  already mean something else (flagged, not interested, default market). */
const CLIENT_TAG_PALETTE = [
  "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  "bg-blue-50 text-blue-700 ring-blue-600/20",
  "bg-purple-50 text-purple-700 ring-purple-600/20",
  "bg-teal-50 text-teal-700 ring-teal-600/20",
  "bg-rose-50 text-rose-700 ring-rose-600/20",
  "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20",
  "bg-orange-50 text-orange-700 ring-orange-600/20",
  "bg-violet-50 text-violet-700 ring-violet-600/20",
];

export function clientTagClass(clientId: string): string {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash * 31 + clientId.charCodeAt(i)) | 0;
  }
  return CLIENT_TAG_PALETTE[Math.abs(hash) % CLIENT_TAG_PALETTE.length];
}

/** A client's own Green/Yellow/Red read on a listing, left from their share page. */
export const CLIENT_REACTIONS = [
  "ReviewFurther",
  "Maybe",
  "NotInterested",
] as const;
export type ClientReaction = (typeof CLIENT_REACTIONS)[number];

export const CLIENT_REACTION_LABELS: Record<ClientReaction, string> = {
  ReviewFurther: "Review further",
  Maybe: "Maybe",
  NotInterested: "Not interested",
};

/** Solid dot color per reaction — used on badges and the picker buttons. */
export const CLIENT_REACTION_DOT: Record<ClientReaction, string> = {
  ReviewFurther: "bg-emerald-500",
  Maybe: "bg-amber-400",
  NotInterested: "bg-red-500",
};

/** Selected-state pill styling per reaction, for the share-page picker. */
export const CLIENT_REACTION_PILL: Record<ClientReaction, string> = {
  ReviewFurther: "bg-emerald-600 text-white",
  Maybe: "bg-amber-500 text-white",
  NotInterested: "bg-red-600 text-white",
};

/** Badge styling for showing a client's reaction back to the internal team. */
export const CLIENT_REACTION_BADGE: Record<ClientReaction, string> = {
  ReviewFurther:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  Maybe: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  NotInterested: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

export function isClientReaction(v: unknown): v is ClientReaction {
  return (
    typeof v === "string" &&
    (CLIENT_REACTIONS as readonly string[]).includes(v)
  );
}

/** The buy-box fields we match on. `buyBoxMarkets` holds market slugs. */
export type BuyBox = {
  buyBoxMarkets: string[];
  buyBoxPriceMin: number | null;
  buyBoxPriceMax: number | null;
  buyBoxCapRateMin: number | null;
  buyBoxUnitMin: number | null;
  buyBoxUnitMax: number | null;
};

/** The listing fields we match against. */
export type MatchableListing = {
  marketSlug: string | null;
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
  if (box.buyBoxMarkets.length > 0) {
    if (
      !listing.marketSlug ||
      !box.buyBoxMarkets.includes(listing.marketSlug)
    ) {
      return false;
    }
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

/**
 * One-line human summary of a buy box. `marketName` maps a slug to a display
 * name (falls back to the slug when a market was deleted).
 */
export function buyBoxSummary(
  box: BuyBox,
  marketName: (slug: string) => string = (s) => s,
): string {
  const parts: string[] = [];

  parts.push(
    box.buyBoxMarkets.length
      ? box.buyBoxMarkets.map((s) => marketName(s)).join(", ")
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
