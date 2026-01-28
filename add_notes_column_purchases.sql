-- Add notes column to inventory_purchases if it doesn't exist
ALTER TABLE "inventory_purchases" 
ADD COLUMN IF NOT EXISTS "notes" TEXT;
