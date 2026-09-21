-- Team review status per listing: Interested / Reviewing / Discarded, with an
-- optional reason and the time it was set. Additive only.
CREATE TYPE "ReviewStatus" AS ENUM ('Interested', 'Reviewing', 'Discarded');

ALTER TABLE "Listing"
  ADD COLUMN "reviewStatus" "ReviewStatus",
  ADD COLUMN "reviewReason" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE INDEX "Listing_reviewStatus_idx" ON "Listing"("reviewStatus");
