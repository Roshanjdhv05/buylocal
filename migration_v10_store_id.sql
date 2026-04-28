-- Migration v10: Add readable Store Display ID (ST-XXXXXX)
-- This ID is used for user-friendly referencing and potentially in URLs/Invoices.

DO $$ 
BEGIN
    -- 1. Add the column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'display_id') THEN
        ALTER TABLE public.stores ADD COLUMN display_id TEXT UNIQUE;
    END IF;

    -- 2. Backfill existing stores with a generated ID based on their UUID
    -- We use the first 6 characters of the UUID to maintain some uniqueness
    UPDATE public.stores 
    SET display_id = 'ST-' || upper(substring(id::text from 1 for 6))
    WHERE display_id IS NULL;

END $$;
