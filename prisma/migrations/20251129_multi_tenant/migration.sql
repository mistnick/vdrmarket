-- ==============================================================================
-- Multi-Tenant Architecture Migration
-- Version: 4.0.0
-- Date: 29 November 2025
-- ==============================================================================
-- This migration transforms the single-tenant VDR into a multi-tenant platform.
-- Architecture: Tenants > DataRooms > Groups > Users
-- ==============================================================================

-- ============================================
-- Step 1: Create Plans table
-- ============================================
CREATE TABLE IF NOT EXISTS "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_vdr" INTEGER NOT NULL DEFAULT 1,
    "max_admin_users" INTEGER NOT NULL DEFAULT 3,
    "max_storage_mb" INTEGER NOT NULL DEFAULT 1024,
    "duration_days" INTEGER,
    "price_monthly" DECIMAL(10, 2),
    "price_yearly" DECIMAL(10, 2),
    "features" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "plans_name_key" ON "plans"("name");

-- ============================================
-- Step 2: Create Tenants table
-- ============================================
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "plan_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "storage_used_mb" INTEGER NOT NULL DEFAULT 0,
    "custom_domain" TEXT,
    "settings" JSONB DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "tenants"("slug");
CREATE INDEX IF NOT EXISTS "tenants_status_idx" ON "tenants"("status");
CREATE INDEX IF NOT EXISTS "tenants_plan_id_idx" ON "tenants"("plan_id");
CREATE INDEX IF NOT EXISTS "tenants_deleted_at_idx" ON "tenants"("deleted_at");

-- ============================================
-- Step 3: Add super admin flag to users
-- ============================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_super_admin" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "users_is_super_admin_idx" ON "users"("is_super_admin");

-- ============================================
-- Step 4: Create TenantUser join table
-- ============================================
CREATE TABLE IF NOT EXISTS "tenant_users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "invited_at" TIMESTAMP(3),
    "invited_by_id" TEXT,
    "joined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_users_tenant_id_user_id_key" ON "tenant_users"("tenant_id", "user_id");
CREATE INDEX IF NOT EXISTS "tenant_users_tenant_id_idx" ON "tenant_users"("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_users_user_id_idx" ON "tenant_users"("user_id");
CREATE INDEX IF NOT EXISTS "tenant_users_status_idx" ON "tenant_users"("status");
CREATE INDEX IF NOT EXISTS "tenant_users_role_idx" ON "tenant_users"("role");

-- ============================================
-- Step 5: Add tenant_id to DataRooms
-- ============================================
ALTER TABLE "data_rooms" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
CREATE INDEX IF NOT EXISTS "data_rooms_tenant_id_idx" ON "data_rooms"("tenant_id");

-- ============================================
-- Step 6: Add foreign key constraints
-- ============================================
ALTER TABLE "tenants" 
    ADD CONSTRAINT "tenants_plan_id_fkey" 
    FOREIGN KEY ("plan_id") REFERENCES "plans"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tenant_users" 
    ADD CONSTRAINT "tenant_users_tenant_id_fkey" 
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_users" 
    ADD CONSTRAINT "tenant_users_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_users" 
    ADD CONSTRAINT "tenant_users_invited_by_id_fkey" 
    FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "data_rooms" 
    ADD CONSTRAINT "data_rooms_tenant_id_fkey" 
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 7: Seed default plans
-- ============================================
INSERT INTO "plans" ("id", "name", "description", "max_vdr", "max_admin_users", "max_storage_mb", "duration_days", "price_monthly", "features")
VALUES 
    ('plan_basic', 'Basic', 'Basic plan for small teams', 1, 2, 1024, NULL, 29.00, '{"watermark": true, "qa": false, "audit_log": false}'),
    ('plan_pro', 'Pro', 'Professional plan for growing businesses', 5, 5, 10240, NULL, 79.00, '{"watermark": true, "qa": true, "audit_log": true, "custom_branding": false}'),
    ('plan_business', 'Business', 'Business plan for enterprises', 20, 20, 102400, NULL, 199.00, '{"watermark": true, "qa": true, "audit_log": true, "custom_branding": true, "api_access": true}'),
    ('plan_enterprise', 'Enterprise', 'Enterprise plan with unlimited features', -1, -1, -1, NULL, NULL, '{"watermark": true, "qa": true, "audit_log": true, "custom_branding": true, "api_access": true, "sso": true, "dedicated_support": true}')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- Step 8: Create tenant audit log table
-- ============================================
CREATE TABLE IF NOT EXISTS "tenant_audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tenant_audit_logs_tenant_id_idx" ON "tenant_audit_logs"("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_audit_logs_user_id_idx" ON "tenant_audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "tenant_audit_logs_action_idx" ON "tenant_audit_logs"("action");
CREATE INDEX IF NOT EXISTS "tenant_audit_logs_created_at_idx" ON "tenant_audit_logs"("created_at");

ALTER TABLE "tenant_audit_logs" 
    ADD CONSTRAINT "tenant_audit_logs_tenant_id_fkey" 
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tenant_audit_logs" 
    ADD CONSTRAINT "tenant_audit_logs_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- Step 9: Create function to update storage usage
-- ============================================
CREATE OR REPLACE FUNCTION update_tenant_storage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tenants 
        SET storage_used_mb = storage_used_mb + (NEW."fileSize" / 1048576)
        WHERE id = (SELECT tenant_id FROM data_rooms WHERE id = NEW."dataRoomId");
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tenants 
        SET storage_used_mb = storage_used_mb - (OLD."fileSize" / 1048576)
        WHERE id = (SELECT tenant_id FROM data_rooms WHERE id = OLD."dataRoomId");
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for storage tracking
DROP TRIGGER IF EXISTS document_storage_trigger ON documents;
CREATE TRIGGER document_storage_trigger
AFTER INSERT OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION update_tenant_storage();
