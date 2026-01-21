-- CreateTable
CREATE TABLE "team_member_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_member_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_member_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_member_types_name_key" ON "team_member_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_statuses_name_key" ON "team_member_statuses"("name");

-- Insert initial data for types
INSERT INTO "team_member_types" ("id", "name", "is_active", "created_at", "updated_at") VALUES
(gen_random_uuid(), 'W2', true, NOW(), NOW()),
(gen_random_uuid(), '1099', true, NOW(), NOW());

-- Insert initial data for statuses
INSERT INTO "team_member_statuses" ("id", "name", "is_active", "created_at", "updated_at") VALUES
(gen_random_uuid(), 'Active', true, NOW(), NOW()),
(gen_random_uuid(), 'Dismissed', true, NOW(), NOW()),
(gen_random_uuid(), 'No Longer Working', true, NOW(), NOW()),
(gen_random_uuid(), 'On Leave', true, NOW(), NOW());
