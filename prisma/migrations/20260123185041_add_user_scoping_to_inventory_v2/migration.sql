-- Note: public_form_key was already added in migration 20260123170446_add_user_scoping_to_inventory
-- Skip adding it again to avoid duplicate column error

-- Update existing NULL user_id values to empty string, then make columns NOT NULL
-- This migration converts nullable user_id columns from v1 to NOT NULL with defaults

-- Update and alter inventory_categories.user_id
UPDATE "inventory_categories" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "inventory_categories" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_categories" ALTER COLUMN "user_id" SET DEFAULT '';

-- Update and alter inventory.user_id
UPDATE "inventory" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "inventory" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory" ALTER COLUMN "user_id" SET DEFAULT '';

-- Update and alter inventory_stores.user_id
UPDATE "inventory_stores" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "inventory_stores" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_stores" ALTER COLUMN "user_id" SET DEFAULT '';

-- Update and alter inventory_purchases.user_id
UPDATE "inventory_purchases" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "inventory_purchases" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_purchases" ALTER COLUMN "user_id" SET DEFAULT '';

-- Update and alter inventory_notes.user_id
UPDATE "inventory_notes" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "inventory_notes" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_notes" ALTER COLUMN "user_id" SET DEFAULT '';

-- Update and alter inventory_form_config.user_id
UPDATE "inventory_form_config" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "inventory_form_config" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_form_config" ALTER COLUMN "user_id" SET DEFAULT '';

-- Update and alter inventory_form_submissions.user_id
UPDATE "inventory_form_submissions" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "inventory_form_submissions" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_form_submissions" ALTER COLUMN "user_id" SET DEFAULT '';

-- Update and alter inventory_snapshots.user_id
UPDATE "inventory_snapshots" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "inventory_snapshots" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_snapshots" ALTER COLUMN "user_id" SET DEFAULT '';

-- Update and alter inventory_technicians.user_id
UPDATE "inventory_technicians" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "inventory_technicians" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_technicians" ALTER COLUMN "user_id" SET DEFAULT '';

-- Update and alter inventory_technician_purchases.user_id
UPDATE "inventory_technician_purchases" SET "user_id" = '' WHERE "user_id" IS NULL;
ALTER TABLE "inventory_technician_purchases" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_technician_purchases" ALTER COLUMN "user_id" SET DEFAULT '';
