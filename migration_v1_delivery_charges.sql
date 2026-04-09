-- Migration: Add delivery_charges to stores and products
-- Run this in the Supabase SQL Editor

-- 1. Update Stores Table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS delivery_charges DECIMAL(10,2) DEFAULT 50.00;

-- 2. Update Products Table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS delivery_charges DECIMAL(10,2) DEFAULT 50.00;

-- Refresh schema cache notification
-- Supabase automatically refreshes the PostgREST cache when columns are added via SQL editor.
