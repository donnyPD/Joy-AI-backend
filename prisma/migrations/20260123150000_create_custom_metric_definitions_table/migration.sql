-- CreateTable
CREATE TABLE IF NOT EXISTS "custom_metric_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "fields" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "threshold" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_metric_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "custom_metric_definitions_name_idx" ON "custom_metric_definitions"("name");
