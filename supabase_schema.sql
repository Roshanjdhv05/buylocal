-- BuyLocal SQL Schema

-- 1. Users Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('buyer', 'seller')) DEFAULT 'buyer',
    city TEXT,
    state TEXT,
    lat FLOAT8,
    lng FLOAT8,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stores Table
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    banner_url TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    lat FLOAT8,
    lng FLOAT8,
    delivery_time TEXT,
    gallery_urls TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Men, Women, Kids
    sizes JSONB DEFAULT '[]'::jsonb,
    colors JSONB DEFAULT '[]'::jsonb,
    age_group TEXT,
    description TEXT,
    online_price DECIMAL(10,2) NOT NULL,
    offline_price DECIMAL(10,2),
    cod_available BOOLEAN DEFAULT TRUE,
    delivery_time TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES public.users(id),
    store_id UUID REFERENCES public.stores(id),
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'dispatched', 'delivered')) DEFAULT 'pending',
    shipping_address TEXT,
    contact_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Stores Table Policies
CREATE POLICY "Stores are viewable by everyone." ON public.stores FOR SELECT USING (true);
CREATE POLICY "Users can create their own store." ON public.stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own store." ON public.stores FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own store." ON public.stores FOR DELETE USING (auth.uid() = owner_id);

-- Products Table Policies
CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Owners can insert products to their store." ON public.products FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.stores s 
        WHERE s.id = products.store_id AND s.owner_id = auth.uid()
    )
);
CREATE POLICY "Owners can update their products." ON public.products FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.stores s 
        WHERE s.id = products.store_id AND s.owner_id = auth.uid()
    )
);
CREATE POLICY "Owners can delete their products." ON public.products FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.stores s 
        WHERE s.id = products.store_id AND s.owner_id = auth.uid()
    )
);

-- Orders Table Policies
CREATE POLICY "Buyers can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view orders for their stores." ON public.orders FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.stores s 
        WHERE s.id = orders.store_id AND s.owner_id = auth.uid()
    )
);
CREATE POLICY "Buyers can place orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update order status." ON public.orders FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.stores s 
        WHERE s.id = orders.store_id AND s.owner_id = auth.uid()
    )
);

-- Realtime Configuration (Needs to be run in Supabase SQL Editor usually)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
