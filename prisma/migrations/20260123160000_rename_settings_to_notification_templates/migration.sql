-- Step 1: Create notification_templates table
CREATE TABLE IF NOT EXISTS "notification_templates" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create unique constraint on created_by_id (one template per user) - MUST be before INSERT
CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_created_by_id_key" 
ON "notification_templates"("created_by_id");

-- Step 3: Create index on created_by_id
CREATE INDEX IF NOT EXISTS "notification_templates_created_by_id_idx" 
ON "notification_templates"("created_by_id");

-- Step 4: Migrate existing data from settings table (if any) to first user
DO $$
DECLARE
    first_user_id TEXT;
    existing_template TEXT;
BEGIN
    -- Get first user ID
    SELECT id INTO first_user_id FROM users ORDER BY "createdAt" ASC LIMIT 1;
    
    -- If users exist and settings table has data, migrate it
    IF first_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
        -- Get existing template from settings table
        SELECT value INTO existing_template FROM settings WHERE key = 'incident_notification_message' LIMIT 1;
        
        -- If template exists, migrate it to notification_templates
        IF existing_template IS NOT NULL THEN
            INSERT INTO "notification_templates" ("id", "created_by_id", "template", "created_at", "updated_at")
            VALUES (gen_random_uuid()::text, first_user_id, existing_template, NOW(), NOW())
            ON CONFLICT ("created_by_id") DO UPDATE SET "template" = EXCLUDED."template", "updated_at" = NOW();
        END IF;
    END IF;
END $$;

-- Step 5: Add foreign key constraint to users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notification_templates_created_by_id_fkey'
    ) THEN
        ALTER TABLE "notification_templates" 
        ADD CONSTRAINT "notification_templates_created_by_id_fkey" 
        FOREIGN KEY ("created_by_id") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 6: Drop old settings table (if it exists)
DROP TABLE IF EXISTS "settings";
