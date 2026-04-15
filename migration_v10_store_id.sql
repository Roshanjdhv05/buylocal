-- Add a unique, user-friendly display_id for stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS display_id TEXT UNIQUE;

-- Backfill existing stores with a unique ID derived from their UUID
-- Format: ST-XXXXXX (6 chars from UUID)
UPDATE public.stores 
SET display_id = 'ST-' || upper(substring(id::text from 1 for 6))
WHERE display_id IS NULL;

-- Ensure future stores can't have null (optional if we handle in frontend, but good for DB safety)
-- ALTER TABLE public.stores ALTER COLUMN display_id SET NOT NULL;
