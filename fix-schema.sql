-- Fix schema migration for data_rooms, documents, and folders
-- Step 1: Add slug column to data_rooms if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rooms' AND column_name = 'slug') THEN
        ALTER TABLE data_rooms ADD COLUMN slug TEXT;
    END IF;
END $$;

-- Step 2: Generate slugs for existing data rooms that don't have one
UPDATE data_rooms
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Step 3: Make slug unique and not null
ALTER TABLE data_rooms ALTER COLUMN slug SET NOT NULL;

-- Check if unique constraint exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'data_rooms_slug_key'
    ) THEN
        ALTER TABLE data_rooms ADD CONSTRAINT data_rooms_slug_key UNIQUE (slug);
    END IF;
END $$;

-- Step 4: Get the first data room ID for orphaned documents and folders
DO $$
DECLARE
    default_dataroom_id TEXT;
BEGIN
    SELECT id INTO default_dataroom_id FROM data_rooms ORDER BY "createdAt" ASC LIMIT 1;
    
    -- Update documents with NULL dataRoomId
    UPDATE documents
    SET "dataRoomId" = default_dataroom_id
    WHERE "dataRoomId" IS NULL;
    
    -- Update folders with NULL dataRoomId
    UPDATE folders
    SET "dataRoomId" = default_dataroom_id
    WHERE "dataRoomId" IS NULL;
END $$;

-- Step 5: Now make dataRoomId NOT NULL (if they aren't already)
ALTER TABLE documents ALTER COLUMN "dataRoomId" SET NOT NULL;
ALTER TABLE folders ALTER COLUMN "dataRoomId" SET NOT NULL;
