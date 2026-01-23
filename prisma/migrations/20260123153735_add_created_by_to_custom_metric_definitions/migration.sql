-- Step 1: Add nullable column first (if it doesn't exist)
ALTER TABLE "custom_metric_definitions" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;

-- Step 2: For existing records, assign them to the first user (if any exists)
-- This ensures data integrity. If no users exist, you must create a user first
UPDATE "custom_metric_definitions" 
SET "created_by_id" = (SELECT id FROM users ORDER BY "created_at" ASC LIMIT 1)
WHERE "created_by_id" IS NULL;

-- Step 3: Make column NOT NULL (only if we have users, otherwise this will fail)
-- If you have existing data without users, you must create a user first
ALTER TABLE "custom_metric_definitions" ALTER COLUMN "created_by_id" SET NOT NULL;

-- Step 4: Create index (if it doesn't exist)
CREATE INDEX IF NOT EXISTS "custom_metric_definitions_created_by_id_idx" 
ON "custom_metric_definitions"("created_by_id");

-- Step 5: Add foreign key constraint (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'custom_metric_definitions_created_by_id_fkey'
    ) THEN
        ALTER TABLE "custom_metric_definitions" 
        ADD CONSTRAINT "custom_metric_definitions_created_by_id_fkey" 
        FOREIGN KEY ("created_by_id") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;
