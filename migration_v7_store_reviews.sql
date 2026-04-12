-- Migration: Create store_reviews table with RLS policies
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.store_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT NOT NULL,
    user_name TEXT,
    user_avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate reviews (one per user per store)
ALTER TABLE public.store_reviews
    DROP CONSTRAINT IF EXISTS unique_user_store_review;
ALTER TABLE public.store_reviews
    ADD CONSTRAINT unique_user_store_review UNIQUE (store_id, user_id);

-- Enable RLS
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read store reviews"
    ON public.store_reviews FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert their own review"
    ON public.store_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review"
    ON public.store_reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review"
    ON public.store_reviews FOR DELETE
    USING (auth.uid() = user_id);
