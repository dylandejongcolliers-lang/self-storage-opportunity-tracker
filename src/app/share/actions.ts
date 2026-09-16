"use server";

import { prisma } from "@/lib/prisma";
import { isClientReaction, type ClientReaction } from "@/lib/clients";

/**
 * Set (or clear, passing null) a client's own reaction on one of their
 * matches. No auth — the share token stands in for it, so every write is
 * scoped to `clientId: client.id` as well as the match id, which also
 * guards against a client mutating another client's match by guessing ids.
 */
export async function setClientReaction(
  token: string,
  matchId: string,
  reaction: ClientReaction | null,
): Promise<{ ok: boolean }> {
  if (reaction !== null && !isClientReaction(reaction)) return { ok: false };

  const client = await prisma.client.findUnique({
    where: { shareToken: token },
    select: { id: true },
  });
  if (!client) return { ok: false };

  try {
    await prisma.listingClientMatch.update({
      where: { id: matchId, clientId: client.id },
      data: {
        clientReaction: reaction,
        clientReactionAt: reaction ? new Date() : null,
      },
    });
  } catch {
    return { ok: false };
  }
  return { ok: true };
}
