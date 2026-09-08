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
import {
  optionalFloat,
  optionalInt,
  optionalStr,
  parseDateOnly,
  str,
} from "@/lib/form";

export type ListingFormState = { ok: boolean; error?: string };

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
