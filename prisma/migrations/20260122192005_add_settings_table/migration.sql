-- CreateTable
CREATE TABLE IF NOT EXISTS "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "settings_key_idx" ON "settings"("key");
