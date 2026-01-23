-- CreateTable
CREATE TABLE "inventory_column_definitions" (
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

-- CreateIndex
CREATE INDEX "inventory_column_definitions_user_id_idx" ON "inventory_column_definitions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_column_definitions_user_id_column_key_key" ON "inventory_column_definitions"("user_id", "column_key");

-- AddForeignKey
ALTER TABLE "inventory_column_definitions" ADD CONSTRAINT "inventory_column_definitions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN "dynamic_fields" JSONB;
