-- Drop the broken trigger and function
DROP TRIGGER IF EXISTS documents_search_vector_update ON "documents";
DROP FUNCTION IF EXISTS documents_search_vector_update;
