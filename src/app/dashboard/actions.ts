"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { isAssignee, isStage, type Assignee, type Stage } from "@/lib/listings";
import {
  matchMarket,
  normalizeState,
  type MarketLite,
} from "@/lib/markets";
import {
  optionalFloat,
  optionalInt,
  optionalStr,
  parseDateOnly,
  str,
} from "@/lib/form";
import type { ListingImportData } from "@/lib/listings-import";

export type ListingFormState = { ok: boolean; error?: string };

async function getMarkets(): Promise<MarketLite[]> {
  return prisma.market.findMany({ orderBy: { sortOrder: "asc" } });
}

function parseListing(formData: FormData) {
  const propertyName = str(formData, "propertyName");
  if (!propertyName) {
    return { error: "Property name is required." as const };
  }

  const stageRaw = str(formData, "stage");
  const assignedRaw = str(formData, "assignedTo");

  return {
    marketId: str(formData, "marketId"),
    state: normalizeState(str(formData, "state")),
    data: {
      propertyName,
      address: str(formData, "address"),
      city: optionalStr(formData, "city"),
      source: str(formData, "source"),
      dateFirstSeen: parseDateOnly(str(formData, "dateFirstSeen")),
      stage: isStage(stageRaw) ? stageRaw : "New",
      askingPrice: optionalInt(formData, "askingPrice"),
      unitCount: optionalInt(formData, "unitCount"),
      nrsf: optionalInt(formData, "nrsf"),
      capRate: optionalFloat(formData, "capRate"),
      listingLink: optionalStr(formData, "listingLink"),
      dealRoomLink: optionalStr(formData, "dealRoomLink"),
      brokerContact: optionalStr(formData, "brokerContact"),
      assignedTo: isAssignee(assignedRaw) ? assignedRaw : null,
      internalNotes: str(formData, "internalNotes"),
    },
  };
}

/** Pick a market: an explicit choice wins, else auto-match on state. */
function resolveMarketId(
  markets: MarketLite[],
  opts: { marketId?: string; state?: string | null; marketName?: string | null },
): string | null {
  if (opts.marketId && markets.some((m) => m.id === opts.marketId)) {
    return opts.marketId;
  }
  return (
    matchMarket(markets, { name: opts.marketName, state: opts.state })?.id ?? null
  );
}

export async function createListing(
  formData: FormData,
): Promise<ListingFormState> {
  await requireAuth();

  const parsed = parseListing(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const markets = await getMarkets();
  const marketId = resolveMarketId(markets, {
    marketId: parsed.marketId,
    state: parsed.state,
  });

  try {
    await prisma.listing.create({
      data: { ...parsed.data, state: parsed.state, marketId },
    });
  } catch {
    return { ok: false, error: "Could not save the listing. Please try again." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateListing(
  formData: FormData,
): Promise<ListingFormState> {
  await requireAuth();

  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing listing id." };

  const parsed = parseListing(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const markets = await getMarkets();
  const marketId = resolveMarketId(markets, {
    marketId: parsed.marketId,
    state: parsed.state,
  });

  try {
    await prisma.listing.update({
      where: { id },
      data: { ...parsed.data, state: parsed.state, marketId },
    });
  } catch {
    return { ok: false, error: "Could not update the listing." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Fast path for the inline Stage / Assigned-to / Market dropdowns in the table. */
export async function updateListingFields(
  id: string,
  fields: {
    stage?: Stage;
    assignedTo?: Assignee | null;
    marketId?: string | null;
    flaggedForReview?: boolean;
  },
): Promise<{ ok: boolean }> {
  await requireAuth();

  const data: {
    stage?: Stage;
    assignedTo?: Assignee | null;
    marketId?: string | null;
    flaggedForReview?: boolean;
    flagReason?: string;
  } = {};

  if (fields.stage !== undefined && isStage(fields.stage)) {
    data.stage = fields.stage;
  }
  if (fields.flaggedForReview !== undefined) {
    data.flaggedForReview = fields.flaggedForReview;
    if (!fields.flaggedForReview) data.flagReason = "";
  }
  if (fields.assignedTo !== undefined) {
    data.assignedTo =
      fields.assignedTo === null || isAssignee(fields.assignedTo)
        ? fields.assignedTo
        : null;
  }
  if (fields.marketId !== undefined) {
    if (fields.marketId === null) {
      data.marketId = null;
    } else {
      const exists = await prisma.market.findUnique({
        where: { id: fields.marketId },
        select: { id: true },
      });
      if (!exists) return { ok: false };
      data.marketId = fields.marketId;
    }
  }

  if (Object.keys(data).length === 0) return { ok: false };

  try {
    await prisma.listing.update({ where: { id }, data });
  } catch {
    return { ok: false };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function createListingsBulk(
  rows: ListingImportData[],
): Promise<{
  ok: boolean;
  count: number;
  needsMarket: number;
  error?: string;
}> {
  await requireAuth();

  const clean = rows.filter((r) => r && r.propertyName?.trim());
  if (clean.length === 0) {
    return { ok: false, count: 0, needsMarket: 0, error: "No rows to import." };
  }
  if (clean.length > 500) {
    return {
      ok: false,
      count: 0,
      needsMarket: 0,
      error: "Too many rows (max 500 at a time).",
    };
  }

  const markets = await getMarkets();
  let needsMarket = 0;

  const data = clean.map((r) => {
    const marketId =
      matchMarket(markets, { name: r.marketRaw, slug: r.marketRaw, state: r.state })
        ?.id ?? null;
    if (!marketId) needsMarket += 1;
    return {
      propertyName: r.propertyName,
      address: r.address,
      city: r.city || null,
      state: normalizeState(r.state),
      marketId,
      source: r.source,
      dateFirstSeen: r.dateFirstSeen,
      stage: r.stage,
      askingPrice: r.askingPrice,
      unitCount: r.unitCount,
      nrsf: r.nrsf,
      capRate: r.capRate,
      listingLink: r.listingLink,
      dealRoomLink: r.dealRoomLink,
      brokerContact: r.brokerContact,
      assignedTo: r.assignedTo,
      internalNotes: r.internalNotes,
    };
  });

  try {
    const res = await prisma.listing.createMany({ data });
    revalidatePath("/dashboard");
    return { ok: true, count: res.count, needsMarket };
  } catch {
    return {
      ok: false,
      count: 0,
      needsMarket: 0,
      error: "Could not import the listings.",
    };
  }
}

export async function deleteListing(id: string): Promise<{ ok: boolean }> {
  await requireAuth();
  try {
    await prisma.listing.delete({ where: { id } });
  } catch {
    return { ok: false };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}
