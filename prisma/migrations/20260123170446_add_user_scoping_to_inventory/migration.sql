-- Add publicFormKey to users table (guarded)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "public_form_key" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_public_form_key_key" ON "users"("public_form_key");
CREATE INDEX IF NOT EXISTS "users_public_form_key_idx" ON "users"("public_form_key");

-- Add userId to inventory_categories (nullable for existing orphaned data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'inventory_categories'
    ) THEN
        ALTER TABLE "inventory_categories" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        CREATE INDEX IF NOT EXISTS "inventory_categories_user_id_idx" ON "inventory_categories"("user_id");
        DROP INDEX IF EXISTS "inventory_categories_name_key";
        CREATE UNIQUE INDEX IF NOT EXISTS "inventory_categories_user_id_name_key" ON "inventory_categories"("user_id", "name");
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_categories_user_id_fkey'
        ) THEN
          ALTER TABLE "inventory_categories" ADD CONSTRAINT "inventory_categories_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Add userId to inventory (nullable for existing orphaned data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'inventory'
    ) THEN
        ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        CREATE INDEX IF NOT EXISTS "inventory_user_id_idx" ON "inventory"("user_id");
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_user_id_fkey'
        ) THEN
          ALTER TABLE "inventory" ADD CONSTRAINT "inventory_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Add userId to inventory_stores (nullable for existing orphaned data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'inventory_stores'
    ) THEN
        ALTER TABLE "inventory_stores" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        CREATE INDEX IF NOT EXISTS "inventory_stores_user_id_idx" ON "inventory_stores"("user_id");
        DROP INDEX IF EXISTS "inventory_stores_name_key";
        CREATE UNIQUE INDEX IF NOT EXISTS "inventory_stores_user_id_name_key" ON "inventory_stores"("user_id", "name");
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_stores_user_id_fkey'
        ) THEN
          ALTER TABLE "inventory_stores" ADD CONSTRAINT "inventory_stores_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Add userId to inventory_purchases (nullable for existing orphaned data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'inventory_purchases'
    ) THEN
        ALTER TABLE "inventory_purchases" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        CREATE INDEX IF NOT EXISTS "inventory_purchases_user_id_idx" ON "inventory_purchases"("user_id");
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_purchases_user_id_fkey'
        ) THEN
          ALTER TABLE "inventory_purchases" ADD CONSTRAINT "inventory_purchases_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Add userId to inventory_notes (nullable for existing orphaned data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'inventory_notes'
    ) THEN
        ALTER TABLE "inventory_notes" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        CREATE INDEX IF NOT EXISTS "inventory_notes_user_id_idx" ON "inventory_notes"("user_id");
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_notes_user_id_fkey'
        ) THEN
          ALTER TABLE "inventory_notes" ADD CONSTRAINT "inventory_notes_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Add userId to inventory_form_config (nullable for existing orphaned data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'inventory_form_config'
    ) THEN
        ALTER TABLE "inventory_form_config" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        CREATE INDEX IF NOT EXISTS "inventory_form_config_user_id_idx" ON "inventory_form_config"("user_id");
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_form_config_user_id_fkey'
        ) THEN
          ALTER TABLE "inventory_form_config" ADD CONSTRAINT "inventory_form_config_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Add userId to inventory_form_submissions (nullable for existing orphaned data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'inventory_form_submissions'
    ) THEN
        ALTER TABLE "inventory_form_submissions" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        CREATE INDEX IF NOT EXISTS "inventory_form_submissions_user_id_idx" ON "inventory_form_submissions"("user_id");
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_form_submissions_user_id_fkey'
        ) THEN
          ALTER TABLE "inventory_form_submissions" ADD CONSTRAINT "inventory_form_submissions_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Add userId to inventory_snapshots (nullable for existing orphaned data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'inventory_snapshots'
    ) THEN
        ALTER TABLE "inventory_snapshots" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        CREATE INDEX IF NOT EXISTS "inventory_snapshots_user_id_idx" ON "inventory_snapshots"("user_id");
        DROP INDEX IF EXISTS "inventory_snapshots_month_year_key";
        CREATE UNIQUE INDEX IF NOT EXISTS "inventory_snapshots_user_id_month_year_key" ON "inventory_snapshots"("user_id", "month", "year");
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_snapshots_user_id_fkey'
        ) THEN
          ALTER TABLE "inventory_snapshots" ADD CONSTRAINT "inventory_snapshots_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Add userId to inventory_technicians (nullable for existing orphaned data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'inventory_technicians'
    ) THEN
        ALTER TABLE "inventory_technicians" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        CREATE INDEX IF NOT EXISTS "inventory_technicians_user_id_idx" ON "inventory_technicians"("user_id");
        DROP INDEX IF EXISTS "inventory_technicians_tech_name_key";
        CREATE UNIQUE INDEX IF NOT EXISTS "inventory_technicians_user_id_tech_name_key" ON "inventory_technicians"("user_id", "tech_name");
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_technicians_user_id_fkey'
        ) THEN
          ALTER TABLE "inventory_technicians" ADD CONSTRAINT "inventory_technicians_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Add userId to inventory_technician_purchases (nullable for existing orphaned data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'inventory_technician_purchases'
    ) THEN
        ALTER TABLE "inventory_technician_purchases" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        CREATE INDEX IF NOT EXISTS "inventory_technician_purchases_user_id_idx" ON "inventory_technician_purchases"("user_id");
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_technician_purchases_user_id_fkey'
        ) THEN
          ALTER TABLE "inventory_technician_purchases" ADD CONSTRAINT "inventory_technician_purchases_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;
