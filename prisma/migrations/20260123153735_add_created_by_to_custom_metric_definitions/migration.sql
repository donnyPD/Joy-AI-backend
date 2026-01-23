-- Step 1: Add nullable column first (if it doesn't exist)
-- Only add column if: table has no records OR (table has records AND users exist)
DO $$
BEGIN
    -- Check if table has records
    IF NOT EXISTS (SELECT 1 FROM "custom_metric_definitions" LIMIT 1) THEN
        -- No records, safe to add column
        ALTER TABLE "custom_metric_definitions" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    ELSIF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        -- Has records AND users exist, safe to add column
        ALTER TABLE "custom_metric_definitions" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    ELSE
        -- Has records BUT no users, unsafe
        RAISE EXCEPTION 'Cannot migrate: custom_metric_definitions has records but no users exist';
    END IF;
END $$;

-- Step 2: For existing records, assign them to the first user (if any exists)
-- This ensures data integrity. Only backfill if table has records AND users exist
DO $$
BEGIN
    -- Only backfill if table has records AND users exist
    IF EXISTS (SELECT 1 FROM "custom_metric_definitions" LIMIT 1) AND EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        UPDATE "custom_metric_definitions" 
        SET "created_by_id" = (SELECT id FROM users ORDER BY "created_at" ASC LIMIT 1)
        WHERE "created_by_id" IS NULL;
    END IF;
    -- If table has no records, no need to backfill (column already added in Step 1)
    -- If table has records but no users, Step 1 would have already raised an exception
END $$;

-- Step 3: Make column NOT NULL (only if we have users, otherwise this will fail)
-- If you have existing data without users, you must create a user first
DO $$
BEGIN
    -- Only proceed if there are no NULL values (meaning Step 2 succeeded or there were no records)
    IF NOT EXISTS (SELECT 1 FROM "custom_metric_definitions" WHERE "created_by_id" IS NULL) THEN
        ALTER TABLE "custom_metric_definitions" ALTER COLUMN "created_by_id" SET NOT NULL;
    ELSE
        RAISE EXCEPTION 'Cannot set NOT NULL: custom_metric_definitions still has NULL created_by_id values';
    END IF;
END $$;

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
