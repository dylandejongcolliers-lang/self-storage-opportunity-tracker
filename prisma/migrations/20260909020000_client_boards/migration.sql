-- Client-labeled boards for organizing listings (many-to-many, no listing copies).

CREATE TABLE "ClientBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientBoard_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ClientBoard_clientId_idx" ON "ClientBoard"("clientId");

CREATE TABLE "ClientBoardListing" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "addedNote" TEXT NOT NULL DEFAULT '',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientBoardListing_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClientBoardListing_boardId_listingId_key" ON "ClientBoardListing"("boardId", "listingId");
CREATE INDEX "ClientBoardListing_listingId_idx" ON "ClientBoardListing"("listingId");

ALTER TABLE "ClientBoard"
    ADD CONSTRAINT "ClientBoard_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientBoardListing"
    ADD CONSTRAINT "ClientBoardListing_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ClientBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientBoardListing"
    ADD CONSTRAINT "ClientBoardListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
