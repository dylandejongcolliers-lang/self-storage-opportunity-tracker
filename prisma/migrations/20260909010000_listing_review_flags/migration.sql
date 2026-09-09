-- Review-queue support for the ingestion API.

ALTER TABLE "Listing"
    ADD COLUMN "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "flagReason" TEXT NOT NULL DEFAULT '';

CREATE INDEX "Listing_flaggedForReview_idx" ON "Listing"("flaggedForReview");
