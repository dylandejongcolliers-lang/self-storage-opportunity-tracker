"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function newShareToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

type MatchTarget = { clientId: string } | { newClientName: string };

/**
 * Push one or more listings into a client's buy box — i.e. create a real
 * ListingClientMatch (the same thing "confirm match" on the Clients page
 * does), which is what shows up on that client's weekly snapshot and their
 * share page once published. Distinct from the board "push" feature, which
 * is purely internal organization.
 */
export async function matchListingsToClient(
  listingIds: string[],
  target: MatchTarget,
  note = "",
): Promise<{
  ok: boolean;
  clientId?: string;
  clientName?: string;
  matched?: number;
  alreadyMatched?: number;
  error?: string;
}> {
  await requireAuth();

  const ids = [...new Set(listingIds)];
  if (ids.length === 0) return { ok: false, error: "No listings selected." };

  let clientId: string;
  let clientName: string;

  if ("clientId" in target) {
    const client = await prisma.client.findUnique({
      where: { id: target.clientId },
      select: { id: true, name: true },
    });
    if (!client) return { ok: false, error: "Client not found." };
    clientId = client.id;
    clientName = client.name;
  } else {
    const name = target.newClientName.trim();
    if (!name) return { ok: false, error: "Client name is required." };
    const existing = await prisma.client.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (existing) {
      clientId = existing.id;
      clientName = existing.name;
    } else {
      try {
        const created = await prisma.client.create({
          data: { name, shareToken: newShareToken() },
        });
        clientId = created.id;
        clientName = created.name;
      } catch {
        return { ok: false, error: "Could not create the client." };
      }
    }
  }

  const before = await prisma.listingClientMatch.count({
    where: { clientId, listingId: { in: ids } },
  });

  try {
    await prisma.$transaction(
      ids.map((listingId) =>
        prisma.listingClientMatch.upsert({
          where: { listingId_clientId: { listingId, clientId } },
          create: { listingId, clientId, weekStatus: "New", clientFacingNotes: note },
          update: note ? { clientFacingNotes: note } : {},
        }),
      ),
    );
  } catch {
    return { ok: false, error: "Could not create the match(es)." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  return {
    ok: true,
    clientId,
    clientName,
    matched: ids.length - before,
    alreadyMatched: before,
  };
}
