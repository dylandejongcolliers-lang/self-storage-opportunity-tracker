"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { str } from "@/lib/form";

export type BoardActionState = { ok: boolean; error?: string };

async function resolveBoardId(target: {
  boardId?: string;
  newName?: string;
}): Promise<{ id: string; name: string } | null> {
  if (target.boardId) {
    const b = await prisma.clientBoard.findUnique({
      where: { id: target.boardId },
      select: { id: true, name: true },
    });
    return b;
  }
  const name = (target.newName ?? "").trim();
  if (!name) return null;
  // Reuse a board with the same name rather than creating a duplicate.
  const existing = await prisma.clientBoard.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (existing) return existing;
  return prisma.clientBoard.create({
    data: { name },
    select: { id: true, name: true },
  });
}

/** Add one or more listings to a board (existing id or a new client name). */
export async function pushListingsToBoard(
  listingIds: string[],
  target: { boardId?: string; newName?: string },
  addedNote = "",
): Promise<{
  ok: boolean;
  boardId?: string;
  boardName?: string;
  added?: number;
  alreadyThere?: number;
  error?: string;
}> {
  await requireAuth();

  const ids = [...new Set(listingIds.filter(Boolean))];
  if (ids.length === 0) return { ok: false, error: "No listings selected." };

  const board = await resolveBoardId(target);
  if (!board) return { ok: false, error: "Pick a board or enter a name." };

  try {
    const res = await prisma.clientBoardListing.createMany({
      data: ids.map((listingId) => ({
        boardId: board.id,
        listingId,
        addedNote: addedNote.slice(0, 280),
      })),
      skipDuplicates: true,
    });
    revalidatePath("/dashboard");
    return {
      ok: true,
      boardId: board.id,
      boardName: board.name,
      added: res.count,
      alreadyThere: ids.length - res.count,
    };
  } catch {
    return { ok: false, error: "Could not add to the board." };
  }
}

/** Remove listings from a board — the association only, never the listing. */
export async function removeListingsFromBoard(
  boardId: string,
  listingIds: string[],
): Promise<{ ok: boolean; removed: number }> {
  await requireAuth();
  const ids = [...new Set(listingIds.filter(Boolean))];
  if (!boardId || ids.length === 0) return { ok: false, removed: 0 };
  try {
    const res = await prisma.clientBoardListing.deleteMany({
      where: { boardId, listingId: { in: ids } },
    });
    revalidatePath("/dashboard");
    return { ok: true, removed: res.count };
  } catch {
    return { ok: false, removed: 0 };
  }
}

export async function createBoard(
  formData: FormData,
): Promise<BoardActionState & { boardId?: string }> {
  await requireAuth();
  const name = str(formData, "name");
  if (!name) return { ok: false, error: "Board name is required." };
  try {
    const b = await prisma.clientBoard.create({
      data: { name },
      select: { id: true },
    });
    revalidatePath("/dashboard");
    return { ok: true, boardId: b.id };
  } catch {
    return { ok: false, error: "Could not create the board." };
  }
}

export async function renameBoard(
  formData: FormData,
): Promise<BoardActionState> {
  await requireAuth();
  const id = str(formData, "id");
  const name = str(formData, "name");
  const clientRaw = str(formData, "clientId");
  if (!id) return { ok: false, error: "Missing board id." };
  if (!name) return { ok: false, error: "Board name is required." };

  const clientId = clientRaw && clientRaw !== "none" ? clientRaw : null;
  if (clientId) {
    const exists = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!exists) return { ok: false, error: "That client no longer exists." };
  }

  try {
    await prisma.clientBoard.update({ where: { id }, data: { name, clientId } });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the board." };
  }
}

export async function deleteBoard(id: string): Promise<{ ok: boolean }> {
  await requireAuth();
  if (!id) return { ok: false };
  try {
    // Cascade drops the ClientBoardListing rows; listings are untouched.
    await prisma.clientBoard.delete({ where: { id } });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
