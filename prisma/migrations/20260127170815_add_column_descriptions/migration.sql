-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "inventory_column_description" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ideal_inventory_column_description" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "to_be_ordered_column_description" TEXT;
