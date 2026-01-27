-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "inventory_column_definitions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "column_key" TEXT NOT NULL,
    "column_label" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_column_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "inventory_column_definitions_user_id_idx" ON "inventory_column_definitions"("user_id");

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_column_definitions_user_id_column_key_key" ON "inventory_column_definitions"("user_id", "column_key");

-- AddForeignKey (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'inventory_column_definitions_user_id_fkey'
    ) THEN
        ALTER TABLE "inventory_column_definitions" ADD CONSTRAINT "inventory_column_definitions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable (if column doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory' AND column_name = 'dynamic_fields'
    ) THEN
        ALTER TABLE "inventory" ADD COLUMN "dynamic_fields" JSONB;
    END IF;
END $$;
