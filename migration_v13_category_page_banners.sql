-- ============================================================
-- Migration v13: Category Page Banners
-- ============================================================
-- Adds a `page_location` column to banner_campaigns so that
-- the admin can post banners specifically to the Category page
-- (phone + desktop responsive), separate from Home page banners.
-- ============================================================

-- 1. Add page_location column
--    Allowed values: 'home' | 'category'
--    Defaults to 'home' so existing banners are unaffected.
ALTER TABLE public.banner_campaigns
    ADD COLUMN IF NOT EXISTS page_location TEXT
        CHECK (page_location IN ('home', 'category'))
        DEFAULT 'home';

-- 2. Update existing admin global banners (store_id IS NULL) to 'home'
UPDATE public.banner_campaigns
    SET page_location = 'home'
    WHERE page_location IS NULL;

-- 3. Drop old admin insert/update/delete policies if they exist,
--    then recreate them to allow admin (store_id IS NULL) rows freely.

-- Insert policy for admin global banners (store_id = null means admin-posted)
DROP POLICY IF EXISTS "Admin can insert global campaigns." ON public.banner_campaigns;
CREATE POLICY "Admin can insert global campaigns."
    ON public.banner_campaigns
    FOR INSERT
    WITH CHECK (store_id IS NULL);

-- Update policy for admin global banners
DROP POLICY IF EXISTS "Admin can update global campaigns." ON public.banner_campaigns;
CREATE POLICY "Admin can update global campaigns."
    ON public.banner_campaigns
    FOR UPDATE
    USING (store_id IS NULL);

-- Delete policy for admin global banners
DROP POLICY IF EXISTS "Admin can delete global campaigns." ON public.banner_campaigns;
CREATE POLICY "Admin can delete global campaigns."
    ON public.banner_campaigns
    FOR DELETE
    USING (store_id IS NULL);

-- 4. Confirm public SELECT is still open (safe duplicate)
DROP POLICY IF EXISTS "Campaigns are viewable by everyone." ON public.banner_campaigns;
CREATE POLICY "Campaigns are viewable by everyone."
    ON public.banner_campaigns
    FOR SELECT
    USING (true);

-- ============================================================
-- HOW TO USE:
--   • page_location = 'home'     → shown on Home page hero slider
--   • page_location = 'category' → shown on Category page banner
--   • banner_url                 → desktop / laptop image URL
--   • mobile_banner_url          → phone screen image URL (optional)
--   • store_id = NULL            → admin global banner
--   • is_active = true/false     → toggle visibility
-- ============================================================

-- ============================================================
-- 5. Supabase Storage Setup (For uploads from device)
-- ============================================================
-- Create the 'store-gallery' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-gallery', 'store-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to files inside 'store-gallery'
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'store-gallery');

-- Allow anyone/admins to upload files inside 'store-gallery' from device
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'store-gallery');

-- Allow public updates to files inside 'store-gallery'
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
CREATE POLICY "Allow public updates" ON storage.objects
    FOR UPDATE USING (bucket_id = 'store-gallery');

-- Allow public deletes to files inside 'store-gallery'
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;
CREATE POLICY "Allow public deletes" ON storage.objects
    FOR DELETE USING (bucket_id = 'store-gallery');

