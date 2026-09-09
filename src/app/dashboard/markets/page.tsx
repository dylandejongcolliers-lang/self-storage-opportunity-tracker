import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { MarketManager } from "./market-manager";

export const metadata = { title: "Markets" };

export default async function MarketsPage() {
  await requireAuth();

  const [markets, grouped] = await Promise.all([
    prisma.market.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.listing.groupBy({
      by: ["marketId"],
      _count: { _all: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const g of grouped) {
    if (g.marketId) counts[g.marketId] = g._count._all;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Markets
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add, edit, or deactivate the markets used across listings and buy
          boxes.
        </p>
      </div>

      <MarketManager markets={markets} counts={counts} />
    </div>
  );
}
