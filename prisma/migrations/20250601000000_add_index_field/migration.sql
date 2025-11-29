-- AddColumnMigration
-- Add hierarchical index field to Document and Folder tables

-- Add index column to documents table
ALTER TABLE "documents" ADD COLUMN "index" TEXT;

-- Add index column to folders table
ALTER TABLE "folders" ADD COLUMN "index" TEXT;

-- Create indexes for better query performance when sorting by index
CREATE INDEX "documents_index_idx" ON "documents"("index");
CREATE INDEX "folders_index_idx" ON "folders"("index");
