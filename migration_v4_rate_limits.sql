-- ============================================================
-- Migration v4: API Rate Limiting Table
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create the rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key         TEXT PRIMARY KEY,                          -- Composite key: "identifier:policy"
    count       INTEGER NOT NULL DEFAULT 1,                -- Request count within current window
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),       -- Start of the current time window
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()         -- Last update timestamp
);

-- Index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start
    ON public.rate_limits (window_start);

-- Index for efficient updated_at cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at
    ON public.rate_limits (updated_at);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- Enable RLS — regular users should NEVER access this table.
-- Only the Netlify function (using service role key) can read/write.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Deny all access to anon and authenticated roles
-- (Service role bypasses RLS entirely, which is what we want)
DROP POLICY IF EXISTS "no_public_access" ON public.rate_limits;
CREATE POLICY "no_public_access"
    ON public.rate_limits
    FOR ALL
    TO public
    USING (false);

-- ============================================================
-- Auto-cleanup: Remove stale rate limit records
-- Using pg_cron (if available in your Supabase plan)
-- Run every hour to delete records older than 1 hour
-- ============================================================
-- Uncomment if pg_cron is enabled on your Supabase project:
/*
SELECT cron.schedule(
    'cleanup-rate-limits',
    '0 * * * *',  -- Every hour
    $$
        DELETE FROM public.rate_limits
        WHERE window_start < NOW() - INTERVAL '1 hour';
    $$
);
*/

-- ============================================================
-- Grant permissions: Only service role can access
-- (This is implicit since RLS blocks all other roles above)
-- ============================================================

COMMENT ON TABLE public.rate_limits IS 'Distributed rate limit counters for the Netlify API proxy. Read/write only via Supabase service role key from Netlify Functions. Regular users have no access (blocked by RLS policy).';

COMMENT ON COLUMN public.rate_limits.key IS 'Composite key format: "type:identifier:policy". Examples: "user:abc123:auth", "ip:1.2.3.4:dataFetch", "apikey:xyz:transactions"';

COMMENT ON COLUMN public.rate_limits.count IS 'Number of requests made within the current time window.';

COMMENT ON COLUMN public.rate_limits.window_start IS 'The timestamp when the current rate limit window started.';
