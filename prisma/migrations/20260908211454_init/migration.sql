-- CreateEnum
CREATE TYPE "Market" AS ENUM ('BayArea', 'SanDiego', 'RenoNorthernNV', 'Other');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('New', 'TeamReviewed', 'UnderwritingOffer');

-- CreateEnum
CREATE TYPE "AssignedTo" AS ENUM ('Dylan', 'Tom');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "market" "Market" NOT NULL DEFAULT 'Other',
    "source" TEXT NOT NULL DEFAULT '',
    "dateFirstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stage" "Stage" NOT NULL DEFAULT 'New',
    "askingPrice" INTEGER,
    "unitCount" INTEGER,
    "nrsf" INTEGER,
    "capRate" DOUBLE PRECISION,
    "listingLink" TEXT,
    "dealRoomLink" TEXT,
    "brokerContact" TEXT,
    "assignedTo" "AssignedTo",
    "internalNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Listing_market_idx" ON "Listing"("market");

-- CreateIndex
CREATE INDEX "Listing_stage_idx" ON "Listing"("stage");
