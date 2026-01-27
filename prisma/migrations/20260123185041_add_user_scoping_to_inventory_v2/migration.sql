-- Note: public_form_key was already added in migration 20260123170446_add_user_scoping_to_inventory
-- Skip adding it again to avoid duplicate column error

-- This migration converts nullable user_id columns from v1 to NOT NULL with defaults
-- It creates or uses a system user UUID for orphaned inventory data

DO $$
DECLARE
  system_user_id TEXT;
  first_user_id TEXT;
BEGIN
  -- Step 1: Try to get the first existing user
  SELECT id INTO first_user_id FROM users ORDER BY "createdAt" ASC LIMIT 1;
  
  -- Step 2: If no users exist, create a system user with a known UUID
  -- Using a deterministic UUID: '00000000-0000-0000-0000-000000000000'
  IF first_user_id IS NULL THEN
    system_user_id := '00000000-0000-0000-0000-000000000000';
    
    -- Create system user if it doesn't exist
    INSERT INTO "users" ("id", "email", "password", "name", "createdAt", "updatedAt")
    VALUES (
      system_user_id,
      'system@joyai.internal',
      '$2b$10$SYSTEM_USER_PASSWORD_HASH_PLACEHOLDER', -- Placeholder hash, should never be used for login
      'System User',
      NOW(),
      NOW()
    )
    ON CONFLICT ("id") DO NOTHING;
  ELSE
    -- Use the first existing user
    system_user_id := first_user_id;
  END IF;
  
  -- Step 3: Update all NULL user_id values to the system/first user UUID
  UPDATE "inventory_categories" SET "user_id" = system_user_id WHERE "user_id" IS NULL;
  UPDATE "inventory" SET "user_id" = system_user_id WHERE "user_id" IS NULL;
  UPDATE "inventory_stores" SET "user_id" = system_user_id WHERE "user_id" IS NULL;
  UPDATE "inventory_purchases" SET "user_id" = system_user_id WHERE "user_id" IS NULL;
  UPDATE "inventory_notes" SET "user_id" = system_user_id WHERE "user_id" IS NULL;
  UPDATE "inventory_form_config" SET "user_id" = system_user_id WHERE "user_id" IS NULL;
  UPDATE "inventory_form_submissions" SET "user_id" = system_user_id WHERE "user_id" IS NULL;
  
  -- Handle inventory_snapshots: Delete NULL records that would create duplicates
  -- Delete snapshots with NULL user_id if a snapshot with the same (month, year) and system_user_id already exists
  DELETE FROM "inventory_snapshots" s1
  WHERE s1."user_id" IS NULL
    AND EXISTS (
      SELECT 1 FROM "inventory_snapshots" s2
      WHERE s2."month" = s1."month"
        AND s2."year" = s1."year"
        AND s2."user_id" = system_user_id
    );
  -- Now update remaining NULL values
  UPDATE "inventory_snapshots" SET "user_id" = system_user_id WHERE "user_id" IS NULL;
  
  UPDATE "inventory_technicians" SET "user_id" = system_user_id WHERE "user_id" IS NULL;
  UPDATE "inventory_technician_purchases" SET "user_id" = system_user_id WHERE "user_id" IS NULL;
END $$;

-- Step 4: Create a function to get the default user ID (first user or system user)
-- This function is STABLE and safe to use in DEFAULT clauses
-- The DO block above ensures a user exists (either first user or system user)
CREATE OR REPLACE FUNCTION get_default_user_id() RETURNS TEXT AS $$
DECLARE
  user_id TEXT;
  system_user_id TEXT := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Try to get the first user
  SELECT id INTO user_id FROM users ORDER BY "createdAt" ASC LIMIT 1;
  
  -- If no user exists, return the system user UUID (which should exist from the DO block above)
  -- This is a fallback in case all users are deleted (shouldn't happen in practice)
  IF user_id IS NULL THEN
    RETURN system_user_id;
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 5: Make columns NOT NULL and set defaults using the function
-- Update and alter inventory_categories.user_id
ALTER TABLE "inventory_categories" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_categories" ALTER COLUMN "user_id" SET DEFAULT get_default_user_id();

-- Update and alter inventory.user_id
ALTER TABLE "inventory" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory" ALTER COLUMN "user_id" SET DEFAULT get_default_user_id();

-- Update and alter inventory_stores.user_id
ALTER TABLE "inventory_stores" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_stores" ALTER COLUMN "user_id" SET DEFAULT get_default_user_id();

-- Update and alter inventory_purchases.user_id
ALTER TABLE "inventory_purchases" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_purchases" ALTER COLUMN "user_id" SET DEFAULT get_default_user_id();

-- Update and alter inventory_notes.user_id
ALTER TABLE "inventory_notes" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_notes" ALTER COLUMN "user_id" SET DEFAULT get_default_user_id();

-- Update and alter inventory_form_config.user_id
ALTER TABLE "inventory_form_config" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_form_config" ALTER COLUMN "user_id" SET DEFAULT get_default_user_id();

-- Update and alter inventory_form_submissions.user_id
ALTER TABLE "inventory_form_submissions" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_form_submissions" ALTER COLUMN "user_id" SET DEFAULT get_default_user_id();

-- Update and alter inventory_snapshots.user_id
ALTER TABLE "inventory_snapshots" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_snapshots" ALTER COLUMN "user_id" SET DEFAULT get_default_user_id();

-- Update and alter inventory_technicians.user_id
ALTER TABLE "inventory_technicians" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_technicians" ALTER COLUMN "user_id" SET DEFAULT get_default_user_id();

-- Update and alter inventory_technician_purchases.user_id
ALTER TABLE "inventory_technician_purchases" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "inventory_technician_purchases" ALTER COLUMN "user_id" SET DEFAULT get_default_user_id();
