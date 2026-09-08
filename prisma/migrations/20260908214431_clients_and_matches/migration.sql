-- CreateEnum
CREATE TYPE "WeekStatus" AS ENUM ('New', 'CarriedOver', 'Updated', 'Passed');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "buyBoxMarkets" "Market"[],
    "buyBoxPriceMin" INTEGER,
    "buyBoxPriceMax" INTEGER,
    "buyBoxCapRateMin" DOUBLE PRECISION,
    "buyBoxUnitMin" INTEGER,
    "buyBoxUnitMax" INTEGER,
    "buyBoxNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingClientMatch" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientFacingNotes" TEXT NOT NULL DEFAULT '',
    "weekStatus" "WeekStatus" NOT NULL DEFAULT 'New',
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingClientMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_shareToken_key" ON "Client"("shareToken");

-- CreateIndex
CREATE INDEX "ListingClientMatch_clientId_idx" ON "ListingClientMatch"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingClientMatch_listingId_clientId_key" ON "ListingClientMatch"("listingId", "clientId");

-- AddForeignKey
ALTER TABLE "ListingClientMatch" ADD CONSTRAINT "ListingClientMatch_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingClientMatch" ADD CONSTRAINT "ListingClientMatch_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
