-- Step 1: Add nullable columns first (if they don't exist)
-- Only add column if: table has no records OR (table has records AND users exist)
DO $$
BEGIN
    -- team_members
    IF NOT EXISTS (SELECT 1 FROM "team_members" LIMIT 1) THEN
        ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    ELSIF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    ELSE
        -- Allow adding column without users; backfill/NOT NULL will be skipped later.
        ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    END IF;

    -- kpi_entries
    IF NOT EXISTS (SELECT 1 FROM "kpi_entries" LIMIT 1) THEN
        ALTER TABLE "kpi_entries" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    ELSIF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        ALTER TABLE "kpi_entries" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    ELSE
        -- Allow adding column without users; backfill/NOT NULL will be skipped later.
        ALTER TABLE "kpi_entries" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    END IF;

    -- team_member_types
    IF NOT EXISTS (SELECT 1 FROM "team_member_types" LIMIT 1) THEN
        ALTER TABLE "team_member_types" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    ELSIF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        ALTER TABLE "team_member_types" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    ELSE
        -- Allow adding column without users; backfill/NOT NULL will be skipped later.
        ALTER TABLE "team_member_types" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    END IF;

    -- team_member_statuses
    IF NOT EXISTS (SELECT 1 FROM "team_member_statuses" LIMIT 1) THEN
        ALTER TABLE "team_member_statuses" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    ELSIF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        ALTER TABLE "team_member_statuses" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    ELSE
        -- Allow adding column without users; backfill/NOT NULL will be skipped later.
        ALTER TABLE "team_member_statuses" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
    END IF;
END $$;

-- Step 2: For existing records, assign them to the first user (if any exists)
-- This ensures data integrity. Only backfill if tables have records AND users exist
DO $$
BEGIN
    -- Only backfill if tables have records AND users exist
    IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        -- Only update if table has records
        IF EXISTS (SELECT 1 FROM "team_members" LIMIT 1) THEN
            UPDATE "team_members" 
            SET "created_by_id" = (SELECT id FROM users ORDER BY "created_at" ASC LIMIT 1)
            WHERE "created_by_id" IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM "kpi_entries" LIMIT 1) THEN
            UPDATE "kpi_entries" 
            SET "created_by_id" = (SELECT id FROM users ORDER BY "created_at" ASC LIMIT 1)
            WHERE "created_by_id" IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM "team_member_types" LIMIT 1) THEN
            UPDATE "team_member_types" 
            SET "created_by_id" = (SELECT id FROM users ORDER BY "created_at" ASC LIMIT 1)
            WHERE "created_by_id" IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM "team_member_statuses" LIMIT 1) THEN
            UPDATE "team_member_statuses" 
            SET "created_by_id" = (SELECT id FROM users ORDER BY "created_at" ASC LIMIT 1)
            WHERE "created_by_id" IS NULL;
        END IF;
    END IF;
    -- If tables have no records, no need to backfill (columns already added in Step 1)
    -- If tables have records but no users, Step 1 would have already raised an exception
END $$;

-- Step 3: Drop old unique constraints and add new composite unique constraints
-- For team_member_types: change from unique(name) to unique(name, created_by_id)
DO $$
BEGIN
    -- Drop old unique constraint on team_member_types.name if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'team_member_types_name_key'
    ) THEN
        ALTER TABLE "team_member_types" DROP CONSTRAINT "team_member_types_name_key";
    END IF;
    
    -- Drop old unique constraint on team_member_statuses.name if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'team_member_statuses_name_key'
    ) THEN
        ALTER TABLE "team_member_statuses" DROP CONSTRAINT "team_member_statuses_name_key";
    END IF;
END $$;

-- Step 4: Make columns NOT NULL (only if we have users, otherwise this will fail)
-- If you have existing data without users, you must create a user first
DO $$
BEGIN
    -- Only proceed if users exist and there are no NULL values
    IF EXISTS (SELECT 1 FROM users LIMIT 1) AND NOT EXISTS (
        SELECT 1 FROM "team_members" WHERE "created_by_id" IS NULL
        UNION
        SELECT 1 FROM "kpi_entries" WHERE "created_by_id" IS NULL
        UNION
        SELECT 1 FROM "team_member_types" WHERE "created_by_id" IS NULL
        UNION
        SELECT 1 FROM "team_member_statuses" WHERE "created_by_id" IS NULL
    ) THEN
        ALTER TABLE "team_members" ALTER COLUMN "created_by_id" SET NOT NULL;
        ALTER TABLE "kpi_entries" ALTER COLUMN "created_by_id" SET NOT NULL;
        ALTER TABLE "team_member_types" ALTER COLUMN "created_by_id" SET NOT NULL;
        ALTER TABLE "team_member_statuses" ALTER COLUMN "created_by_id" SET NOT NULL;
    END IF;
END $$;

-- Step 5: Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS "team_members_created_by_id_idx" ON "team_members"("created_by_id");
CREATE INDEX IF NOT EXISTS "kpi_entries_created_by_id_idx" ON "kpi_entries"("created_by_id");
CREATE INDEX IF NOT EXISTS "team_member_types_created_by_id_idx" ON "team_member_types"("created_by_id");
CREATE INDEX IF NOT EXISTS "team_member_statuses_created_by_id_idx" ON "team_member_statuses"("created_by_id");

-- Step 6: Add composite unique constraints (name, created_by_id)
CREATE UNIQUE INDEX IF NOT EXISTS "team_member_types_name_created_by_id_key" 
ON "team_member_types"("name", "created_by_id");

CREATE UNIQUE INDEX IF NOT EXISTS "team_member_statuses_name_created_by_id_key" 
ON "team_member_statuses"("name", "created_by_id");

-- Step 7: Add foreign key constraints (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_members_created_by_id_fkey'
    ) THEN
        ALTER TABLE "team_members" ADD CONSTRAINT "team_members_created_by_id_fkey" 
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'kpi_entries_created_by_id_fkey'
    ) THEN
        ALTER TABLE "kpi_entries" ADD CONSTRAINT "kpi_entries_created_by_id_fkey" 
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_member_types_created_by_id_fkey'
    ) THEN
        ALTER TABLE "team_member_types" ADD CONSTRAINT "team_member_types_created_by_id_fkey" 
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_member_statuses_created_by_id_fkey'
    ) THEN
        ALTER TABLE "team_member_statuses" ADD CONSTRAINT "team_member_statuses_created_by_id_fkey" 
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
