// Shared labels and formatting for Listing enums. Safe to import from client
// components (no server-only code here).

export const MARKETS = [
  "BayArea",
  "SanDiego",
  "RenoNorthernNV",
  "Other",
] as const;
export type Market = (typeof MARKETS)[number];

export const MARKET_LABELS: Record<Market, string> = {
  BayArea: "Bay Area",
  SanDiego: "San Diego",
  RenoNorthernNV: "Reno / Northern NV",
  Other: "Other",
};

export const STAGES = ["New", "TeamReviewed", "UnderwritingOffer"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  New: "New",
  TeamReviewed: "Team Reviewed",
  UnderwritingOffer: "Underwriting / Offer",
};

/**
 * One shared badge style per stage, drawn from the brand palette:
 * harbor navy for New, brass/sand for Team Reviewed, evergreen for
 * Underwriting / Offer. Used in the table, the client view, and matches.
 */
export const STAGE_BADGE_CLASS: Record<Stage, string> = {
  New: "bg-[#edf1f7] text-[#264a72] ring-1 ring-inset ring-[#264a72]/20",
  TeamReviewed: "bg-[#f4eede] text-[#7a5a2c] ring-1 ring-inset ring-[#7a5a2c]/20",
  UnderwritingOffer:
    "bg-[#e7efe8] text-[#3a6043] ring-1 ring-inset ring-[#3a6043]/20",
};

export const ASSIGNEES = ["Dylan", "Tom"] as const;
export type Assignee = (typeof ASSIGNEES)[number];

export const SORTS = [
  "newest",
  "oldest",
  "priceHigh",
  "priceLow",
  "property",
  "stage",
] as const;
export type SortKey = (typeof SORTS)[number];

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  priceHigh: "Price: high → low",
  priceLow: "Price: low → high",
  property: "Property name (A–Z)",
  stage: "Stage",
};

export function isMarket(v: unknown): v is Market {
  return typeof v === "string" && (MARKETS as readonly string[]).includes(v);
}

export function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (STAGES as readonly string[]).includes(v);
}

export function isAssignee(v: unknown): v is Assignee {
  return typeof v === "string" && (ASSIGNEES as readonly string[]).includes(v);
}

export function isSortKey(v: unknown): v is SortKey {
  return typeof v === "string" && (SORTS as readonly string[]).includes(v);
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toFixed(2)}%`;
}

// `dateFirstSeen` is stored anchored to 12:00 UTC on a calendar day (see the
// server action). Format and round-trip it in UTC so the day never shifts.

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** For an <input type="date"> value (YYYY-MM-DD). */
export function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
