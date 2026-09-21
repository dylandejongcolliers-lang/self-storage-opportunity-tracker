import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { buildListingQuery, orderByFor } from "@/lib/listing-filters";
import { buildListingsWorkbook } from "@/lib/export-listings";
import {
  REVIEW_STATUS_LABELS,
  STAGE_LABELS,
  isReviewStatus,
  isStage,
} from "@/lib/listings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /dashboard/export?<same params as the Listings page>
 * Downloads the listings currently on screen (same view, board, market,
 * stage/status, search and sort) as an .xlsx. Session-cookie protected.
 */
export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sp = Object.fromEntries(new URL(request.url).searchParams.entries());

  const [markets, board] = await Promise.all([
    prisma.market.findMany({ select: { slug: true, name: true } }),
    sp.board
      ? prisma.clientBoard.findUnique({
          where: { id: sp.board },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  const query = buildListingQuery({
    sp,
    marketSlugs: new Set(markets.map((m) => m.slug)),
    activeBoardId: board?.id,
  });

  const listings = await prisma.listing.findMany({
    where: query.where,
    orderBy: orderByFor(query.sort),
    include: {
      matches: {
        select: { clientReaction: true, client: { select: { name: true } } },
      },
    },
  });

  // Human-readable description of what's in the file.
  const parts: string[] = [];
  if (query.view === "review") parts.push("Review queue");
  if (board && query.view === "board") parts.push(`Board: ${board.name}`);
  if (query.marketFilter === "unassigned") parts.push("Needs market");
  else if (query.marketFilter !== "all") {
    parts.push(
      `Market: ${markets.find((m) => m.slug === query.marketFilter)?.name ?? query.marketFilter}`,
    );
  }
  if (isStage(query.stageFilter)) {
    parts.push(`Stage: ${STAGE_LABELS[query.stageFilter]}`);
  }
  if (query.statusFilter === "none") parts.push("Status: Not reviewed");
  else if (isReviewStatus(query.statusFilter)) {
    parts.push(`Status: ${REVIEW_STATUS_LABELS[query.statusFilter]}`);
  }
  if (query.q) parts.push(`Search: “${query.q}”`);
  const scope = parts.length
    ? `${parts.join(" · ")} (${listings.length} deals)`
    : `All listings (${listings.length} deals)`;

  const file = await buildListingsWorkbook(listings, scope);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Listings export ${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
