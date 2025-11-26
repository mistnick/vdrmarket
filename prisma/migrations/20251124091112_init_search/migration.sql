-- Add search vector column
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create index for fast full-text search
CREATE INDEX IF NOT EXISTS "documents_search_idx" ON "documents" USING GIN ("search_vector");

-- Create function to update search vector
CREATE OR REPLACE FUNCTION documents_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to update search vector on insert or update
DROP TRIGGER IF EXISTS documents_search_vector_update ON "documents";
CREATE TRIGGER documents_search_vector_update
BEFORE INSERT OR UPDATE ON "documents"
FOR EACH ROW EXECUTE FUNCTION documents_search_vector_update();

-- Backfill existing data
UPDATE "documents" SET search_vector =
    setweight(to_tsvector('english', COALESCE(name, '')), 'A');
