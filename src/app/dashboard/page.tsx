import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { isSortKey, isStage, type SortKey } from "@/lib/listings";
import { Filters } from "./filters";
import { ReviewTabs } from "./review-tabs";
import { AddListingDialog } from "./add-listing-dialog";
import { BulkAddDialog } from "./bulk-add-dialog";
import { ListingsTable } from "./listings-table";

export const metadata = { title: "Listings" };

const REVIEW_WHERE: Prisma.ListingWhereInput = {
  OR: [{ marketId: null }, { flaggedForReview: true }],
};

function orderByFor(sort: SortKey): Prisma.ListingOrderByWithRelationInput[] {
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAuth();

  const sp = await searchParams;
  const marketParam = typeof sp.market === "string" ? sp.market : undefined;
  const stageParam = typeof sp.stage === "string" ? sp.stage : undefined;
  const sortParam = typeof sp.sort === "string" ? sp.sort : undefined;
  const sort: SortKey = isSortKey(sortParam) ? sortParam : "newest";
  const view: "all" | "review" = sp.view === "review" ? "review" : "all";

  const markets = await prisma.market.findMany({ orderBy: { sortOrder: "asc" } });
  const marketSlugs = new Set(markets.map((m) => m.slug));

  const where: Prisma.ListingWhereInput = {};
  if (stageParam && isStage(stageParam)) where.stage = stageParam;
  let marketFilter: string = "all";
  if (marketParam === "unassigned") {
    where.marketId = null;
    marketFilter = "unassigned";
  } else if (marketParam && marketSlugs.has(marketParam)) {
    where.market = { slug: marketParam };
    marketFilter = marketParam;
  }
  if (view === "review") where.OR = REVIEW_WHERE.OR;

  const [listings, total, reviewCount] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: orderByFor(sort),
      include: { market: true },
    }),
    prisma.listing.count(),
    prisma.listing.count({ where: REVIEW_WHERE }),
  ]);

  const filtered = listings.length !== total;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Listings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {view === "review"
              ? `${listings.length} in the review queue`
              : filtered
                ? `${listings.length} of ${total} listings`
                : `${total} ${total === 1 ? "listing" : "listings"} tracked`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <BulkAddDialog markets={markets} />
          <AddListingDialog markets={markets} />
        </div>
      </div>

      <ReviewTabs view={view} reviewCount={reviewCount} />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-3">
          <Filters
            market={marketFilter}
            stage={stageParam && isStage(stageParam) ? stageParam : "all"}
            sort={sort}
            markets={markets}
          />
        </div>
        <ListingsTable
          listings={listings}
          markets={markets}
          emptyReview={view === "review"}
        />
      </section>
    </div>
  );
}
