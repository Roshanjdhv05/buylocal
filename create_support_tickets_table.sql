-- Run this script in your Supabase SQL Editor to create the support_tickets table

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_type VARCHAR(50) DEFAULT 'guest',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    store_name VARCHAR(255),
    order_id VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    issue_type VARCHAR(100),
    subject TEXT,
    description TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(50) DEFAULT 'Open',
    priority VARCHAR(50) DEFAULT 'Medium',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup RLS (Row Level Security)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert tickets (since users might not be logged in or guest support is possible)
CREATE POLICY "Allow public insert to support_tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);

-- Allow users to read their own tickets if logged in
CREATE POLICY "Allow users to read own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
