-- Table for storing Web Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subscription)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);
