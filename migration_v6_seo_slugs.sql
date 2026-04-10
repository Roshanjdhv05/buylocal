-- 1. Create a simple slugify function
CREATE OR REPLACE FUNCTION slugify(value TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Lowercase and replace non-alphanumeric characters with hyphens
  RETURN trim(both '-' from regexp_replace(lower(value), '[^a-z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- 2. Add slug column to products if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' 
                   AND table_name='products' 
                   AND column_name='slug') THEN
        ALTER TABLE public.products ADD COLUMN slug TEXT;
    END IF;
END $$;

-- 3. Populate existing products with slug based on name + short id suffix to ensure uniqueness
UPDATE public.products 
SET slug = slugify(name) || '-' || substring(id::text from 1 for 6)
WHERE slug IS NULL;

-- 4. Make slug unique so it can be uniquely queried
ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
