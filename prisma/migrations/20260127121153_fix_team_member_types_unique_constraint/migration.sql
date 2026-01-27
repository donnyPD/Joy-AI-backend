-- Fix Team Member Types Unique Constraint
-- This migration drops the old unique index on 'name' only and ensures
-- the composite unique index on (name, created_by_id) exists.

-- Drop old unique index on team_member_types.name (if exists)
-- Note: Prisma creates unique indexes, not constraints, so we use DROP INDEX
DROP INDEX IF EXISTS "team_member_types_name_key";

-- Drop old unique index on team_member_statuses.name (if exists)
DROP INDEX IF EXISTS "team_member_statuses_name_key";

-- Create composite unique index for team_member_types (if not exists)
-- This allows the same name for different users
CREATE UNIQUE INDEX IF NOT EXISTS "team_member_types_name_created_by_id_key" 
ON "team_member_types"("name", "created_by_id");

-- Create composite unique index for team_member_statuses (if not exists)
-- This allows the same name for different users
CREATE UNIQUE INDEX IF NOT EXISTS "team_member_statuses_name_created_by_id_key" 
ON "team_member_statuses"("name", "created_by_id");
