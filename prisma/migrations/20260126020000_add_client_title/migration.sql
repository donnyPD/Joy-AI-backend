-- Add title field to clients
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "title" TEXT;
