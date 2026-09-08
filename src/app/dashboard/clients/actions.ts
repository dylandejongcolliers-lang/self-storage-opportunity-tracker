"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { isMarket, type Market } from "@/lib/listings";
import { isWeekStatus, type WeekStatus } from "@/lib/clients";
import { optionalFloat, optionalInt, str } from "@/lib/form";

export type ClientFormState = { ok: boolean; error?: string };

function newShareToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function parseBuyBox(formData: FormData) {
  const markets = formData
    .getAll("buyBoxMarkets")
    .map((v) => String(v))
    .filter((v): v is Market => isMarket(v));

  return {
    buyBoxMarkets: markets,
    buyBoxPriceMin: optionalInt(formData, "buyBoxPriceMin"),
    buyBoxPriceMax: optionalInt(formData, "buyBoxPriceMax"),
    buyBoxCapRateMin: optionalFloat(formData, "buyBoxCapRateMin"),
    buyBoxUnitMin: optionalInt(formData, "buyBoxUnitMin"),
    buyBoxUnitMax: optionalInt(formData, "buyBoxUnitMax"),
    buyBoxNotes: str(formData, "buyBoxNotes"),
  };
}

export async function createClient(
  formData: FormData,
): Promise<ClientFormState> {
  await requireAuth();

  const name = str(formData, "name");
  if (!name) return { ok: false, error: "Client name is required." };

  try {
    await prisma.client.create({
      data: { name, shareToken: newShareToken(), ...parseBuyBox(formData) },
    });
  } catch {
    return { ok: false, error: "Could not create the client." };
  }

  revalidatePath("/dashboard/clients");
  return { ok: true };
}

export async function updateClient(
  formData: FormData,
): Promise<ClientFormState> {
  await requireAuth();

  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id) return { ok: false, error: "Missing client id." };
  if (!name) return { ok: false, error: "Client name is required." };

  try {
    await prisma.client.update({
      where: { id },
      data: { name, ...parseBuyBox(formData) },
    });
  } catch {
    return { ok: false, error: "Could not update the client." };
  }

  revalidatePath("/dashboard/clients");
  return { ok: true };
}

export async function deleteClient(id: string): Promise<{ ok: boolean }> {
  await requireAuth();
  try {
    await prisma.client.delete({ where: { id } });
  } catch {
    return { ok: false };
  }
  revalidatePath("/dashboard/clients");
  return { ok: true };
}

export async function regenerateShareToken(
  id: string,
): Promise<{ ok: boolean }> {
  await requireAuth();
  try {
    await prisma.client.update({
      where: { id },
      data: { shareToken: newShareToken() },
    });
  } catch {
    return { ok: false };
  }
  revalidatePath("/dashboard/clients");
  return { ok: true };
}

/** Confirm a listing<->client pairing. Idempotent. */
export async function confirmMatch(
  listingId: string,
  clientId: string,
): Promise<{ ok: boolean }> {
  await requireAuth();
  try {
    await prisma.listingClientMatch.upsert({
      where: { listingId_clientId: { listingId, clientId } },
      create: { listingId, clientId, weekStatus: "New" },
      update: {},
    });
  } catch {
    return { ok: false };
  }
  revalidatePath("/dashboard/clients");
  return { ok: true };
}

export async function updateMatch(
  id: string,
  fields: { clientFacingNotes?: string; weekStatus?: WeekStatus },
): Promise<{ ok: boolean }> {
  await requireAuth();

  const data: { clientFacingNotes?: string; weekStatus?: WeekStatus } = {};
  if (typeof fields.clientFacingNotes === "string") {
    data.clientFacingNotes = fields.clientFacingNotes;
  }
  if (fields.weekStatus !== undefined && isWeekStatus(fields.weekStatus)) {
    data.weekStatus = fields.weekStatus;
  }
  if (Object.keys(data).length === 0) return { ok: false };

  try {
    await prisma.listingClientMatch.update({ where: { id }, data });
  } catch {
    return { ok: false };
  }
  revalidatePath("/dashboard/clients");
  return { ok: true };
}

export async function removeMatch(id: string): Promise<{ ok: boolean }> {
  await requireAuth();
  try {
    await prisma.listingClientMatch.delete({ where: { id } });
  } catch {
    return { ok: false };
  }
  revalidatePath("/dashboard/clients");
  return { ok: true };
}

/**
 * Lock in this week's snapshot for a client: stamp `lastPublishedAt` and flip
 * every match that is currently New or Updated to CarriedOver, so next week's
 * New/Updated badges only reflect genuine changes.
 */
export async function publishSnapshot(
  clientId: string,
): Promise<{ ok: boolean; carriedOver?: number }> {
  await requireAuth();

  try {
    const [flipped] = await prisma.$transaction([
      prisma.listingClientMatch.updateMany({
        where: { clientId, weekStatus: { in: ["New", "Updated"] } },
        data: { weekStatus: "CarriedOver" },
      }),
      prisma.client.update({
        where: { id: clientId },
        data: { lastPublishedAt: new Date() },
      }),
    ]);

    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${clientId}/publish`);
    return { ok: true, carriedOver: flipped.count };
  } catch {
    return { ok: false };
  }
}
