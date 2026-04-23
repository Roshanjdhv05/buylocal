-- Migration v11: Product Groups (Combine Products as Variants)
-- Run this in Supabase SQL Editor

-- Add group columns to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_group_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS group_display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_group_cover BOOLEAN DEFAULT FALSE;

-- Index for fast group lookups
CREATE INDEX IF NOT EXISTS idx_products_group_id ON products(product_group_id);

-- Allow sellers to update their own products' group fields
-- (Existing RLS policies should already cover this since they allow UPDATE on own store products)
