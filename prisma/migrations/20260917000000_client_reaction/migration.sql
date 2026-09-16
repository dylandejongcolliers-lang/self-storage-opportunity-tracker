-- Client reactions (Green/Yellow/Red) left from the share page.
CREATE TYPE "ClientReaction" AS ENUM ('ReviewFurther', 'Maybe', 'NotInterested');

ALTER TABLE "ListingClientMatch"
  ADD COLUMN "clientReaction" "ClientReaction",
  ADD COLUMN "clientReactionAt" TIMESTAMP(3);
