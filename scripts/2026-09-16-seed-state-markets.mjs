// One-time data migration: replace the hand-picked city/region markets
// (Bay Area, San Diego, Reno/Northern NV) with all 50 US states as markets,
// then re-assign every existing listing to its state's market and remap any
// client buy-box references. No schema change — the Market table already
// supports this shape (name/slug/region/states/color/active/sortOrder).
//
// Safe to re-run: state markets are upserted by slug, and the listing/
// client remap is idempotent (it's just "assign based on current state").
//
// Usage: node scripts/2026-09-16-seed-state-markets.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This project doesn't load .env automatically outside of `next dev`/`next
// build` — pull DATABASE_URL out of it directly so this can run standalone.
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, "..", ".env");
  const envText = fs.readFileSync(envPath, "utf8");
  const m = envText.match(/^DATABASE_URL="([^"]+)"/m);
  if (!m) throw new Error("DATABASE_URL not found in .env");
  process.env.DATABASE_URL = m[1];
}

const prisma = new PrismaClient();

// [code, full name, Census region]
const STATES = [
  ["CT", "Connecticut", "Northeast"],
  ["ME", "Maine", "Northeast"],
  ["MA", "Massachusetts", "Northeast"],
  ["NH", "New Hampshire", "Northeast"],
  ["RI", "Rhode Island", "Northeast"],
  ["VT", "Vermont", "Northeast"],
  ["NJ", "New Jersey", "Northeast"],
  ["NY", "New York", "Northeast"],
  ["PA", "Pennsylvania", "Northeast"],

  ["IL", "Illinois", "Midwest"],
  ["IN", "Indiana", "Midwest"],
  ["MI", "Michigan", "Midwest"],
  ["OH", "Ohio", "Midwest"],
  ["WI", "Wisconsin", "Midwest"],
  ["IA", "Iowa", "Midwest"],
  ["KS", "Kansas", "Midwest"],
  ["MN", "Minnesota", "Midwest"],
  ["MO", "Missouri", "Midwest"],
  ["NE", "Nebraska", "Midwest"],
  ["ND", "North Dakota", "Midwest"],
  ["SD", "South Dakota", "Midwest"],

  ["DE", "Delaware", "South"],
  ["FL", "Florida", "South"],
  ["GA", "Georgia", "South"],
  ["MD", "Maryland", "South"],
  ["NC", "North Carolina", "South"],
  ["SC", "South Carolina", "South"],
  ["VA", "Virginia", "South"],
  ["WV", "West Virginia", "South"],
  ["AL", "Alabama", "South"],
  ["KY", "Kentucky", "South"],
  ["MS", "Mississippi", "South"],
  ["TN", "Tennessee", "South"],
  ["AR", "Arkansas", "South"],
  ["LA", "Louisiana", "South"],
  ["OK", "Oklahoma", "South"],
  ["TX", "Texas", "South"],

  ["AZ", "Arizona", "West"],
  ["CO", "Colorado", "West"],
  ["ID", "Idaho", "West"],
  ["MT", "Montana", "West"],
  ["NV", "Nevada", "West"],
  ["NM", "New Mexico", "West"],
  ["UT", "Utah", "West"],
  ["WY", "Wyoming", "West"],
  ["AK", "Alaska", "West"],
  ["CA", "California", "West"],
  ["HI", "Hawaii", "West"],
  ["OR", "Oregon", "West"],
  ["WA", "Washington", "West"],
];

const REGION_ORDER = ["Northeast", "Midwest", "South", "West"];
const REGION_COLOR = {
  Northeast: "#1c3a5e", // navy
  Midwest: "#3f6043", // evergreen
  South: "#8a4b3a", // clay
  West: "#5f83a8", // steel
};

async function main() {
  console.log(`Seeding ${STATES.length} state markets...`);

  const idByCode = new Map();
  for (const [code, name, region] of STATES) {
    const slug = code.toLowerCase();
    const regionIdx = REGION_ORDER.indexOf(region);
    const withinRegionIdx = STATES.filter((s) => s[2] === region).findIndex(
      (s) => s[0] === code,
    );
    const market = await prisma.market.upsert({
      where: { slug },
      update: {
        name,
        region,
        states: [code],
        color: REGION_COLOR[region],
        active: true,
        sortOrder: regionIdx * 100 + withinRegionIdx,
      },
      create: {
        name,
        slug,
        region,
        states: [code],
        color: REGION_COLOR[region],
        active: true,
        sortOrder: regionIdx * 100 + withinRegionIdx,
      },
    });
    idByCode.set(code, market.id);
  }
  console.log(`Upserted ${idByCode.size} state markets.`);

  // Re-point every listing at its state's market (this naturally moves the
  // old Bay Area / San Diego listings to California, and Reno/Northern NV
  // listings to Nevada, since it's driven by the listing's own state field).
  const listings = await prisma.listing.findMany({
    select: { id: true, state: true, marketId: true },
  });
  let reassigned = 0;
  let stillUnassigned = 0;
  for (const l of listings) {
    const targetId = l.state ? idByCode.get(l.state) ?? null : null;
    if (targetId == null) {
      stillUnassigned++;
      if (l.marketId !== null) {
        await prisma.listing.update({
          where: { id: l.id },
          data: { marketId: null },
        });
      }
      continue;
    }
    if (l.marketId !== targetId) {
      await prisma.listing.update({
        where: { id: l.id },
        data: { marketId: targetId },
      });
      reassigned++;
    }
  }
  console.log(
    `Listings: ${listings.length} total, ${reassigned} (re)assigned to a state market, ${stillUnassigned} left unassigned (no recognized state).`,
  );

  // Remap client buy-box market slugs from the old markets to their state.
  const OLD_SLUG_TO_STATE_SLUG = {
    "bay-area": "ca",
    "san-diego": "ca",
    "reno-northern-nv": "nv",
  };
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, buyBoxMarkets: true },
  });
  for (const c of clients) {
    const next = [
      ...new Set(
        c.buyBoxMarkets.map((s) => OLD_SLUG_TO_STATE_SLUG[s] ?? s),
      ),
    ];
    const changed =
      next.length !== c.buyBoxMarkets.length ||
      next.some((s, i) => s !== c.buyBoxMarkets[i]);
    if (changed) {
      await prisma.client.update({
        where: { id: c.id },
        data: { buyBoxMarkets: next },
      });
      console.log(
        `Client "${c.name}": buyBoxMarkets ${JSON.stringify(c.buyBoxMarkets)} -> ${JSON.stringify(next)}`,
      );
    }
  }

  // Retire the old city/region markets now that nothing references them.
  const oldSlugs = Object.keys(OLD_SLUG_TO_STATE_SLUG);
  const stillReferenced = await prisma.listing.count({
    where: { market: { slug: { in: oldSlugs } } },
  });
  if (stillReferenced > 0) {
    console.warn(
      `Refusing to delete old markets — ${stillReferenced} listing(s) still reference them.`,
    );
  } else {
    const { count } = await prisma.market.deleteMany({
      where: { slug: { in: oldSlugs } },
    });
    console.log(`Deleted ${count} legacy city/region markets.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
