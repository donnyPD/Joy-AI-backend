-- Add delivered column to inventory_form_submissions if it doesn't exist
ALTER TABLE "inventory_form_submissions" 
ADD COLUMN IF NOT EXISTS "delivered" BOOLEAN NOT NULL DEFAULT false;
