-- Add security enhancements to Link, Team, and Document models
-- Migration: add_security_enhancements

-- Add security fields to links table
ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "maxViews" INTEGER;
ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "allowedDomains" JSONB;

-- Add index for efficient view count checking
CREATE INDEX IF NOT EXISTS "links_viewCount_idx" ON "links"("viewCount");

-- Add file upload security fields to teams table
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "maxFileSize" INTEGER NOT NULL DEFAULT 104857600;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "allowedFileTypes" JSONB;

-- Add file security fields to documents table
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "scanStatus" TEXT DEFAULT 'pending';
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "scanResult" JSONB;

-- Add index for filtering documents by scan status
CREATE INDEX IF NOT EXISTS "documents_scanStatus_idx" ON "documents"("scanStatus");

-- Add default expiration for existing links (null = no expiration, keep current behavior)
-- No action needed for existing records
