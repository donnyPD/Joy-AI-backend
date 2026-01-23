-- AlterTable
-- Only add threshold column if table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'custom_metric_definitions'
    ) THEN
        ALTER TABLE "custom_metric_definitions" ADD COLUMN IF NOT EXISTS "threshold" INTEGER;
    END IF;
END $$;
