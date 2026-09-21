import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  REVIEW_WHERE,
  buildListingQuery,
  orderByFor,
} from "@/lib/listing-filters";
import type { BoardLite } from "@/lib/boards";
import { Filters } from "./filters";
import { SearchBox } from "./search-box";
import { ExportButton } from "./export-button";
import { ReviewTabs } from "./review-tabs";
import { BoardTabs } from "./board-tabs";
import { BoardSettings } from "./board-settings";
import { AddListingDialog } from "./add-listing-dialog";
import { BulkAddDialog } from "./bulk-add-dialog";
import { ListingsTable } from "./listings-table";

export const metadata = { title: "Listings" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAuth();

  const sp = await searchParams;
  const boardParam = typeof sp.board === "string" ? sp.board : undefined;

  const [markets, boardRows, clients] = await Promise.all([
    prisma.market.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.clientBoard.findMany({
      orderBy: { name: "asc" },
      include: {
        client: { select: { name: true } },
        _count: { select: { listings: true } },
      },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const boards: BoardLite[] = boardRows.map((b) => ({
    id: b.id,
    name: b.name,
    count: b._count.listings,
    clientId: b.clientId,
    clientName: b.client?.name ?? null,
  }));

  const activeBoard = boardParam
    ? boards.find((b) => b.id === boardParam)
    : undefined;
  const { where, sort, view, marketFilter, stageFilter, statusFilter } =
    buildListingQuery({
      sp,
      marketSlugs: new Set(markets.map((m) => m.slug)),
      activeBoardId: activeBoard?.id,
    });

  // boardLinks is scoped to the active board (or nothing when not on a board),
  // so every row carries a consistent shape.
  const [listings, total, reviewCount] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: orderByFor(sort),
      include: {
        market: true,
        boardLinks: {
          where: { boardId: activeBoard?.id ?? "__no_board__" },
          select: { addedNote: true },
        },
        matches: {
          select: { client: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.listing.count(),
    prisma.listing.count({ where: REVIEW_WHERE }),
  ]);

  const filtered = listings.length !== total;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Listings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {view === "review"
              ? `${listings.length} in the review queue`
              : view === "board"
                ? `${listings.length} on this board`
                : filtered
                  ? `${listings.length} of ${total} listings`
                  : `${total} ${total === 1 ? "listing" : "listings"} tracked`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ExportButton />
          <BulkAddDialog markets={markets} />
          <AddListingDialog markets={markets} />
        </div>
      </div>

      <SearchBox />

      <div className="space-y-3">
        <ReviewTabs view={view} reviewCount={reviewCount} />
        <BoardTabs boards={boards} activeBoardId={activeBoard?.id} />
      </div>

      {activeBoard ? (
        <BoardSettings board={activeBoard} clients={clients} />
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-3">
          <Filters
            market={marketFilter}
            stage={stageFilter}
            status={statusFilter}
            sort={sort}
            markets={markets}
          />
        </div>
        <ListingsTable
          listings={listings}
          markets={markets}
          boards={boards}
          clients={clients}
          activeBoardId={activeBoard?.id}
          emptyReview={view === "review"}
          emptyBoard={view === "board"}
        />
      </section>
    </div>
  );
}
