-- Migration: Add free_delivery_threshold to stores
-- Run this in the Supabase SQL Editor

-- 1. Update Stores Table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS free_delivery_threshold DECIMAL(10,2) DEFAULT NULL;

-- Note: If free_delivery_threshold is NULL, the feature is disabled.
-- If it's a value (e.g., 500), free delivery applies above that amount.
