-- Migration: Product Variants System
-- Supports Color, Size, Design, Volume variations per product

-- 1. Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    color TEXT,
    size TEXT,
    design TEXT,
    volume TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    sku TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint to prevent duplicate combinations for the same product
    UNIQUE (product_id, color, size, design, volume)
);

-- 2. Add variant_id to cart_items if table exists
-- If cart_items doesn't exist, this will fail gracefully or we can create it
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cart_items' AND table_schema = 'public') THEN
        ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;
    ELSE
        -- Create cart_items table if it doesn't exist (it seems it's used in the app)
        CREATE TABLE IF NOT EXISTS public.cart_items (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
            variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
            quantity INTEGER DEFAULT 1,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (user_id, product_id, variant_id)
        );
    END IF;
END $$;

-- 3. Enable RLS on product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- 4. Policies for product_variants
CREATE POLICY "Variants are viewable by everyone." ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "Owners can manage variants." ON public.product_variants FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.stores s ON p.store_id = s.id
        WHERE p.id = product_variants.product_id AND s.owner_id = auth.uid()
    )
);

-- 5. Enable Realtime
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
