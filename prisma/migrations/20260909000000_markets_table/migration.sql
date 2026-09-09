-- Replace the hardcoded "Market" enum with a runtime-managed markets table.
-- Data-preserving: existing enum values are mapped to seeded market rows,
-- city/state are parsed from the free-text address, and client buy-box
-- markets become an array of slugs.

-- 0. Free up the name "Market" (a table and a type can't share it) --------
ALTER TYPE "Market" RENAME TO "Market_old";

-- 1. Market table -----------------------------------------------------------
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT '',
    "states" TEXT[],
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Market_name_key" ON "Market"("name");
CREATE UNIQUE INDEX "Market_slug_key" ON "Market"("slug");
CREATE INDEX "Market_active_idx" ON "Market"("active");

-- 2. Seed the three existing markets (West Coast) --------------------------
INSERT INTO "Market"
    ("id", "name", "slug", "region", "states", "color", "active", "sortOrder", "createdAt", "updatedAt")
VALUES
    ('mkt_bay_area',          'Bay Area',            'bay-area',          'West Coast', ARRAY['CA'], '#1c3a5e', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mkt_san_diego',         'San Diego',           'san-diego',         'West Coast', ARRAY['CA'], '#3f6043', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mkt_reno_northern_nv',  'Reno / Northern NV',  'reno-northern-nv',  'West Coast', ARRAY['NV'], '#7a5a2c', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Listing: add city / state / marketId --------------------------------
ALTER TABLE "Listing"
    ADD COLUMN "city" TEXT,
    ADD COLUMN "state" TEXT,
    ADD COLUMN "marketId" TEXT;

-- 4. Backfill marketId from the old enum ---------------------------------
UPDATE "Listing" SET "marketId" = 'mkt_bay_area'         WHERE "market"::text = 'BayArea';
UPDATE "Listing" SET "marketId" = 'mkt_san_diego'        WHERE "market"::text = 'SanDiego';
UPDATE "Listing" SET "marketId" = 'mkt_reno_northern_nv' WHERE "market"::text = 'RenoNorthernNV';
-- 'Other' is intentionally left as marketId = NULL (needs manual assignment)

-- 5. Best-effort parse of city / state from the address ------------------
--    Matches a trailing ", City, ST" optionally followed by a ZIP code.
UPDATE "Listing" SET
    "city"  = btrim((regexp_match("address", ',\s*([^,]+),\s*([A-Za-z]{2})(?:\s+\d{5}(?:-\d{4})?)?\s*$'))[1]),
    "state" = upper((regexp_match("address", ',\s*([^,]+),\s*([A-Za-z]{2})(?:\s+\d{5}(?:-\d{4})?)?\s*$'))[2])
WHERE "address" ~ ',\s*[^,]+,\s*[A-Za-z]{2}(?:\s+\d{5}(?:-\d{4})?)?\s*$';

-- 6. Foreign key + index ------------------------------------------------
ALTER TABLE "Listing"
    ADD CONSTRAINT "Listing_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Listing_marketId_idx" ON "Listing"("marketId");

-- 7. Drop the old enum column + its index ------------------------------
DROP INDEX "Listing_market_idx";
ALTER TABLE "Listing" DROP COLUMN "market";

-- 8. Client.buyBoxMarkets: enum[] -> TEXT[] of market slugs -----------
ALTER TABLE "Client" ADD COLUMN "buyBoxMarkets_new" TEXT[];
UPDATE "Client" SET "buyBoxMarkets_new" = (
    SELECT array_agg(s)
    FROM (
        SELECT CASE elem::text
            WHEN 'BayArea'        THEN 'bay-area'
            WHEN 'SanDiego'       THEN 'san-diego'
            WHEN 'RenoNorthernNV' THEN 'reno-northern-nv'
        END AS s
        FROM unnest("buyBoxMarkets") AS elem
    ) mapped
    WHERE s IS NOT NULL
);
ALTER TABLE "Client" DROP COLUMN "buyBoxMarkets";
ALTER TABLE "Client" RENAME COLUMN "buyBoxMarkets_new" TO "buyBoxMarkets";

-- 9. Drop the now-unused enum type ----------------------------------
DROP TYPE "Market_old";
