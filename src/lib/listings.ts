// Shared labels and formatting for Listing enums. Safe to import from client
// components (no server-only code here).
// Market is no longer an enum — see src/lib/markets.ts and the Market table.

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

/**
 * The team's own call on a listing — separate from Stage. Order is the order
 * shown in menus and filters (most interested → discarded). No status yet
 * (null in the database) means "not reviewed".
 */
export const REVIEW_STATUSES = ["Interested", "Reviewing", "Discarded"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  Interested: "Interested",
  Reviewing: "Reviewing",
  Discarded: "Discarded",
};

/** Solid dot per status (menus, badges): green / yellow / red. */
export const REVIEW_STATUS_DOT: Record<ReviewStatus, string> = {
  Interested: "bg-emerald-500",
  Reviewing: "bg-yellow-400",
  Discarded: "bg-red-500",
};

/** Badge style per status. */
export const REVIEW_STATUS_BADGE: Record<ReviewStatus, string> = {
  Interested: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/25",
  Reviewing: "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/30",
  Discarded: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/25",
};

/** Whole-line highlight for a table row (with a slightly deeper hover). */
export const REVIEW_ROW_TINT: Record<ReviewStatus, string> = {
  Interested: "bg-emerald-100/60 hover:bg-emerald-100",
  Reviewing: "bg-yellow-100/70 hover:bg-yellow-100",
  Discarded: "bg-red-100/60 hover:bg-red-100",
};

/** Same highlight for mobile cards (no hover shift). */
export const REVIEW_BLOCK_TINT: Record<ReviewStatus, string> = {
  Interested: "bg-emerald-100/60",
  Reviewing: "bg-yellow-100/70",
  Discarded: "bg-red-100/60",
};

/** Same highlight for the expanded detail row, holding its color on hover. */
export const REVIEW_DETAIL_TINT: Record<ReviewStatus, string> = {
  Interested: "bg-emerald-100/60 hover:bg-emerald-100/60",
  Reviewing: "bg-yellow-100/70 hover:bg-yellow-100/70",
  Discarded: "bg-red-100/60 hover:bg-red-100/60",
};

/** Quick picks offered (but never required) when adding a reason. */
export const REVIEW_REASON_SUGGESTIONS = [
  "Price too high",
  "Cap rate too low",
  "Market / location",
  "Size",
  "Condition / deferred maintenance",
  "Seller not motivated",
  "Client not interested",
] as const;

export function isReviewStatus(v: unknown): v is ReviewStatus {
  return (
    typeof v === "string" && (REVIEW_STATUSES as readonly string[]).includes(v)
  );
}

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
