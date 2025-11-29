-- Drop obsolete teamId columns from various tables
ALTER TABLE documents DROP COLUMN IF EXISTS "teamId";
ALTER TABLE folders DROP COLUMN IF EXISTS "teamId";
ALTER TABLE data_rooms DROP COLUMN IF EXISTS "teamId";
ALTER TABLE audit_logs DROP COLUMN IF EXISTS "teamId";
ALTER TABLE tags DROP COLUMN IF EXISTS "teamId";

-- Drop team_invitations table if it exists
DROP TABLE IF EXISTS team_invitations CASCADE;
