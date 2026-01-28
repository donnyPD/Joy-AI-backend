-- Rename tagsDb table to customs_tags if needed (guarded)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tagsDb'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customs_tags'
  ) THEN
    ALTER TABLE "tagsDb" RENAME TO customs_tags;
  END IF;
END $$;
