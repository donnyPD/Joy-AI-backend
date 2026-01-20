-- CreateTable
CREATE TABLE "kpi_entries" (
    "id" TEXT NOT NULL,
    "team_member_id" TEXT NOT NULL,
    "kpi_type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_notes" (
    "id" TEXT NOT NULL,
    "note_text" TEXT NOT NULL,
    "ny_timestamp" TEXT NOT NULL,
    "note_type" TEXT NOT NULL DEFAULT 'general',
    "team_member_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_technician_purchases" (
    "id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "purchase_date" TEXT NOT NULL,
    "items_raw" TEXT NOT NULL,
    "items_parsed" JSONB,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_technician_purchases_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "kpi_entries" ADD CONSTRAINT "kpi_entries_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_notes" ADD CONSTRAINT "inventory_notes_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
