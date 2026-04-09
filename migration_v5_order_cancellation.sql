-- ============================================================
-- Migration v5: Allow buyer order cancellation
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Drop the old CHECK constraint on status
ALTER TABLE public.orders
    DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Add updated CHECK constraint that includes 'cancelled'
ALTER TABLE public.orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'accepted', 'dispatched', 'delivered', 'cancelled', 'rejected'));

-- Step 3: Add a column to track who cancelled and when (optional but useful)
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS cancelled_at      TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS cancelled_by      TEXT        DEFAULT NULL,   -- 'buyer' or 'seller'
    ADD COLUMN IF NOT EXISTS cancel_reason     TEXT        DEFAULT NULL;

-- Step 4: Add RLS policy — buyers can cancel their OWN orders,
--         but ONLY when status is 'pending' (before seller accepts)
--         Sellers can already update via the existing seller policy.
CREATE POLICY "Buyers can cancel their own pending orders."
    ON public.orders
    FOR UPDATE
    USING (
        auth.uid() = buyer_id
        AND status IN ('pending')   -- can only cancel before seller accepts
    )
    WITH CHECK (
        auth.uid() = buyer_id
        AND status = 'cancelled'    -- buyer can only SET it to cancelled
    );

-- ============================================================
-- Verification queries (run separately to confirm)
-- ============================================================
-- SELECT conname, consrc FROM pg_constraint WHERE conname = 'orders_status_check';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cancelled_at';
