import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { matchMarket, normalizeState, type MarketLite } from "@/lib/markets";
import { dedupeKey } from "@/lib/listings-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS = 500;

type RowStatus =
  | "created"
  | "skipped_duplicate"
  | "needs_market_assignment"
  | "rejected";

type RowResult = {
  index: number;
  propertyName: string;
  status: RowStatus;
  id?: string;
  existingId?: string;
  marketId?: string | null;
  reason?: string;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function bearerOk(header: string | null): boolean {
  const expected = process.env.INGEST_API_TOKEN;
  if (!expected) return false;
  const m = /^Bearer\s+(.+)$/i.exec(header ?? "");
  if (!m) return false;
  const got = Buffer.from(m[1]);
  const want = Buffer.from(expected);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

function toOptStr(v: unknown): string | null {
  const s = toStr(v);
  return s.length ? s : null;
}

function toInt(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function toFloat(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Accept "YYYY-MM-DD", "M/D/YYYY", a full ISO timestamp, or nothing → today.
 *  Anchored to 12:00 UTC on the calendar day so it never shifts. */
function toDate(v: unknown): Date {
  const s = toStr(v);
  let y: number | undefined;
  let mo: number | undefined;
  let d: number | undefined;

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (iso) {
    y = +iso[1];
    mo = +iso[2];
    d = +iso[3];
  } else if (us) {
    mo = +us[1];
    d = +us[2];
    y = +us[3] < 100 ? 2000 + +us[3] : +us[3];
  } else if (s) {
    const parsed = new Date(s);
    if (!Number.isNaN(parsed.getTime())) {
      y = parsed.getUTCFullYear();
      mo = parsed.getUTCMonth() + 1;
      d = parsed.getUTCDate();
    }
  }

  if (y && mo && d) {
    const dt = new Date(Date.UTC(y, mo - 1, d, 12));
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12),
  );
}

export async function POST(request: Request) {
  if (!process.env.INGEST_API_TOKEN) {
    return NextResponse.json(
      { error: "Ingestion API is not configured (INGEST_API_TOKEN unset)." },
      { status: 503 },
    );
  }
  if (!bearerOk(request.headers.get("authorization"))) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON array of listing objects." },
      { status: 400 },
    );
  }
  if (body.length === 0) {
    return NextResponse.json({
      summary: {
        total: 0,
        created: 0,
        skipped_duplicate: 0,
        needs_market_assignment: 0,
        rejected: 0,
      },
      results: [],
    });
  }
  if (body.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS} per request).` },
      { status: 400 },
    );
  }

  const markets: MarketLite[] = await prisma.market.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const existing = await prisma.listing.findMany({
    select: { id: true, propertyName: true, city: true, state: true },
  });
  const seen = new Map<string, string>();
  for (const l of existing) {
    seen.set(dedupeKey(l.propertyName, l.city, l.state), l.id);
  }

  const results: RowResult[] = [];

  for (let i = 0; i < body.length; i++) {
    const raw = body[i];
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      results.push({
        index: i,
        propertyName: "",
        status: "rejected",
        reason: "Row must be a JSON object.",
      });
      continue;
    }
    const row = raw as Record<string, unknown>;
    const propertyName = toStr(row.propertyName);
    if (!propertyName) {
      results.push({
        index: i,
        propertyName: "",
        status: "rejected",
        reason: "propertyName is required.",
      });
      continue;
    }

    const city = toOptStr(row.city);
    const state = normalizeState(toStr(row.state));
    const key = dedupeKey(propertyName, city, state);
    if (seen.has(key)) {
      results.push({
        index: i,
        propertyName,
        status: "skipped_duplicate",
        existingId: seen.get(key),
      });
      continue;
    }

    const marketRaw = toStr(row.market);
    const marketId =
      matchMarket(markets, {
        name: marketRaw,
        slug: marketRaw,
        state,
      })?.id ?? null;

    const flaggedForReview = row.flaggedForReview === true;

    try {
      const created = await prisma.listing.create({
        data: {
          propertyName,
          address: toStr(row.address),
          city,
          state,
          marketId,
          source: toStr(row.source),
          dateFirstSeen: toDate(row.dateFirstSeen),
          stage: "New", // always forced — never accept a stage override here
          askingPrice: toInt(row.askingPrice),
          unitCount: toInt(row.unitCount),
          nrsf: toInt(row.nrsf),
          capRate: toFloat(row.capRate),
          listingLink: toOptStr(row.listingLink),
          dealRoomLink: toOptStr(row.dealRoomLink),
          brokerContact: toOptStr(row.brokerContact),
          internalNotes: toStr(row.internalNotes),
          flaggedForReview,
          flagReason: flaggedForReview ? toStr(row.flagReason) : "",
        },
        select: { id: true },
      });
      seen.set(key, created.id);
      results.push({
        index: i,
        propertyName,
        status: marketId ? "created" : "needs_market_assignment",
        id: created.id,
        marketId,
      });
    } catch {
      results.push({
        index: i,
        propertyName,
        status: "rejected",
        reason: "Database error while creating the listing.",
      });
    }
  }

  const summary = {
    total: results.length,
    created: results.filter((r) => r.status === "created").length,
    skipped_duplicate: results.filter((r) => r.status === "skipped_duplicate")
      .length,
    needs_market_assignment: results.filter(
      (r) => r.status === "needs_market_assignment",
    ).length,
    rejected: results.filter((r) => r.status === "rejected").length,
  };

  if (summary.created + summary.needs_market_assignment > 0) {
    revalidatePath("/dashboard");
  }

  return NextResponse.json({ summary, results });
}

export function GET() {
  return NextResponse.json(
    { error: "Use POST with a JSON array of listing objects." },
    { status: 405 },
  );
}
