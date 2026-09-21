// The Listings page's filter / search / sort rules, shared so the page and the
// spreadsheet export always agree on exactly which listings are "on screen".

import type { Prisma } from "@prisma/client";
import {
  isReviewStatus,
  isSortKey,
  isStage,
  type ReviewStatus,
  type SortKey,
} from "@/lib/listings";

export type SearchParams = { [key: string]: string | string[] | undefined };

export const REVIEW_WHERE: Prisma.ListingWhereInput = {
  OR: [{ marketId: null }, { flaggedForReview: true }],
};

export function orderByFor(
  sort: SortKey,
): Prisma.ListingOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ dateFirstSeen: "asc" }, { createdAt: "asc" }];
    case "priceHigh":
      return [{ askingPrice: { sort: "desc", nulls: "last" } }];
    case "priceLow":
      return [{ askingPrice: { sort: "asc", nulls: "last" } }];
    case "property":
      return [{ propertyName: "asc" }];
    case "stage":
      return [{ stage: "asc" }, { dateFirstSeen: "desc" }];
    case "newest":
    default:
      return [{ dateFirstSeen: "desc" }, { createdAt: "desc" }];
  }
}

const str = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : undefined;

export type ListingQuery = {
  where: Prisma.ListingWhereInput;
  sort: SortKey;
  view: "all" | "review" | "board";
  marketFilter: string; // "all" | "unassigned" | market slug
  stageFilter: string; // "all" | Stage
  statusFilter: string; // "all" | "none" (not reviewed) | ReviewStatus
  q: string;
};

/**
 * Turn the page's URL params into a Prisma `where`. `activeBoardId` must
 * already be validated by the caller (i.e. the board really exists).
 */
export function buildListingQuery({
  sp,
  marketSlugs,
  activeBoardId,
}: {
  sp: SearchParams;
  marketSlugs: Set<string>;
  activeBoardId?: string;
}): ListingQuery {
  const marketParam = str(sp.market);
  const stageParam = str(sp.stage);
  const statusParam = str(sp.status);
  const sortParam = str(sp.sort);
  const sort: SortKey = isSortKey(sortParam) ? sortParam : "newest";

  const view: "all" | "review" | "board" = activeBoardId
    ? "board"
    : sp.view === "review"
      ? "review"
      : "all";

  const where: Prisma.ListingWhereInput = {};
  const and: Prisma.ListingWhereInput[] = [];

  let stageFilter = "all";
  if (stageParam && isStage(stageParam)) {
    where.stage = stageParam;
    stageFilter = stageParam;
  }

  let statusFilter = "all";
  if (statusParam === "none") {
    where.reviewStatus = null;
    statusFilter = "none";
  } else if (statusParam && isReviewStatus(statusParam)) {
    where.reviewStatus = statusParam as ReviewStatus;
    statusFilter = statusParam;
  }

  let marketFilter = "all";
  if (marketParam === "unassigned") {
    where.marketId = null;
    marketFilter = "unassigned";
  } else if (marketParam && marketSlugs.has(marketParam)) {
    where.market = { slug: marketParam };
    marketFilter = marketParam;
  }

  if (view === "review") and.push({ OR: REVIEW_WHERE.OR });
  if (activeBoardId) where.boardLinks = { some: { boardId: activeBoardId } };

  const q = (str(sp.q) ?? "").trim();
  if (q) {
    and.push({
      OR: [
        { propertyName: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { state: { contains: q, mode: "insensitive" } },
        { source: { contains: q, mode: "insensitive" } },
        { brokerContact: { contains: q, mode: "insensitive" } },
        { internalNotes: { contains: q, mode: "insensitive" } },
        { market: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (and.length) where.AND = and;

  return { where, sort, view, marketFilter, stageFilter, statusFilter, q };
}
