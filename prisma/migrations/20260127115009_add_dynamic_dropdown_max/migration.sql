-- Add dropdown_max_by_type JSON column (nullable initially)
ALTER TABLE "inventory_form_config" ADD COLUMN "dropdown_max_by_type" JSONB;

-- Migrate existing data: convert dropdownMax and dropdownMaxW2 to JSON structure
-- Default to {"1099": 5, "W2": 5} if values are missing
UPDATE "inventory_form_config"
SET "dropdown_max_by_type" = jsonb_build_object(
  '1099', COALESCE("dropdown_max", 5),
  'W2', COALESCE("dropdown_max_w2", 5)
)
WHERE "dropdown_max_by_type" IS NULL;

-- Set default for new records
ALTER TABLE "inventory_form_config" 
ALTER COLUMN "dropdown_max_by_type" SET DEFAULT '{"1099": 5, "W2": 5}'::jsonb;

-- Make column NOT NULL after migration
ALTER TABLE "inventory_form_config" 
ALTER COLUMN "dropdown_max_by_type" SET NOT NULL;

-- Drop old columns
ALTER TABLE "inventory_form_config" DROP COLUMN "dropdown_max";
ALTER TABLE "inventory_form_config" DROP COLUMN "dropdown_max_w2";
