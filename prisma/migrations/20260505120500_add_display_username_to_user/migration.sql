-- Add optional display username required by better-auth username plugin.
ALTER TABLE "user"
ADD COLUMN "displayUsername" TEXT;
