-- Apply the migration SQL manually
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_ideal_inventory" INTEGER NOT NULL DEFAULT 0;
