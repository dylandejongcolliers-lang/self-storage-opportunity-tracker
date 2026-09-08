"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  isAssignee,
  isMarket,
  isStage,
  type Assignee,
  type Stage,
} from "@/lib/listings";

export type ListingFormState = { ok: boolean; error?: string };

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optionalStr(formData: FormData, key: string): string | null {
  const v = str(formData, key);
  return v.length ? v : null;
}

function optionalInt(formData: FormData, key: string): number | null {
  const raw = str(formData, key).replace(/[$,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function optionalFloat(formData: FormData, key: string): number | null {
  const raw = str(formData, key).replace(/[%,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Turn a "YYYY-MM-DD" value from <input type="date"> into a Date fixed at
 * 12:00 UTC on that calendar day. Anchoring to noon UTC keeps the date from
 * sliding to the previous/next day when it's later formatted in a timezone up
 * to 12 hours off UTC. Falls back to today (also at noon UTC) when empty.
 */
function parseDateOnly(raw: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 12));
  }
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12),
  );
}

function parseListing(formData: FormData) {
  const propertyName = str(formData, "propertyName");
  if (!propertyName) {
    return { error: "Property name is required." as const };
  }

  const marketRaw = str(formData, "market");
  const stageRaw = str(formData, "stage");
  const assignedRaw = str(formData, "assignedTo");
  const parsedDate = parseDateOnly(str(formData, "dateFirstSeen"));

  return {
    data: {
      propertyName,
      address: str(formData, "address"),
      market: isMarket(marketRaw) ? marketRaw : "Other",
      source: str(formData, "source"),
      dateFirstSeen: parsedDate,
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

export async function createListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  await requireAuth();

  const parsed = parseListing(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    await prisma.listing.create({ data: parsed.data });
  } catch {
    return { ok: false, error: "Could not save the listing. Please try again." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  await requireAuth();

  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing listing id." };

  const parsed = parseListing(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    await prisma.listing.update({ where: { id }, data: parsed.data });
  } catch {
    return { ok: false, error: "Could not update the listing." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Fast path for the inline Stage / Assigned-to dropdowns in the table. */
export async function updateListingFields(
  id: string,
  fields: { stage?: Stage; assignedTo?: Assignee | null },
): Promise<{ ok: boolean }> {
  await requireAuth();

  const data: { stage?: Stage; assignedTo?: Assignee | null } = {};
  if (fields.stage !== undefined && isStage(fields.stage)) {
    data.stage = fields.stage;
  }
  if (fields.assignedTo !== undefined) {
    data.assignedTo =
      fields.assignedTo === null || isAssignee(fields.assignedTo)
        ? fields.assignedTo
        : null;
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
