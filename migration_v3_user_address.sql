-- Migration: Add address and phone details to users table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS landmark TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update city and state if they were missing (should exist but to be safe)
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state TEXT;
