"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { parseStates, slugify } from "@/lib/markets";
import { optionalInt, str } from "@/lib/form";

export type MarketFormState = { ok: boolean; error?: string };

const HEX = /^#[0-9a-fA-F]{6}$/;

function parseMarket(formData: FormData) {
  const name = str(formData, "name");
  if (!name) return { error: "Market name is required." as const };

  const colorRaw = str(formData, "color");
  const sortOrder = optionalInt(formData, "sortOrder");

  return {
    data: {
      name,
      region: str(formData, "region"),
      states: parseStates(str(formData, "states")),
      color: HEX.test(colorRaw) ? colorRaw.toLowerCase() : "#64748b",
      sortOrder: sortOrder ?? 0,
    },
  };
}

export async function createMarket(
  formData: FormData,
): Promise<MarketFormState> {
  await requireAuth();

  const parsed = parseMarket(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const slug = slugify(parsed.data.name);
  if (!slug) return { ok: false, error: "Name must contain letters or numbers." };

  const clash = await prisma.market.findFirst({
    where: { OR: [{ name: parsed.data.name }, { slug }] },
    select: { id: true },
  });
  if (clash) {
    return { ok: false, error: "A market with that name already exists." };
  }

  let { sortOrder } = parsed.data;
  if (!sortOrder) {
    const last = await prisma.market.aggregate({ _max: { sortOrder: true } });
    sortOrder = (last._max.sortOrder ?? 0) + 10;
  }

  try {
    await prisma.market.create({
      data: { ...parsed.data, slug, sortOrder },
    });
  } catch {
    return { ok: false, error: "Could not create the market." };
  }

  revalidatePath("/dashboard/markets");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateMarket(
  formData: FormData,
): Promise<MarketFormState> {
  await requireAuth();

  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing market id." };

  const parsed = parseMarket(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const slug = slugify(parsed.data.name);
  const clash = await prisma.market.findFirst({
    where: {
      id: { not: id },
      OR: [{ name: parsed.data.name }, { slug }],
    },
    select: { id: true },
  });
  if (clash) {
    return { ok: false, error: "Another market already uses that name." };
  }

  try {
    await prisma.market.update({
      where: { id },
      data: { ...parsed.data, slug },
    });
  } catch {
    return { ok: false, error: "Could not update the market." };
  }

  revalidatePath("/dashboard/markets");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setMarketActive(
  id: string,
  active: boolean,
): Promise<{ ok: boolean }> {
  await requireAuth();
  try {
    await prisma.market.update({ where: { id }, data: { active } });
  } catch {
    return { ok: false };
  }
  revalidatePath("/dashboard/markets");
  revalidatePath("/dashboard");
  return { ok: true };
}
