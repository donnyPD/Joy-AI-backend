-- Add times field to visits
ALTER TABLE "visits" ADD COLUMN IF NOT EXISTS "times" TEXT;
