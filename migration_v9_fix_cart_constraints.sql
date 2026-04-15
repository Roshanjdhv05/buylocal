-- Update unique constraint for cart_items to include variant_id
DO $$ 
BEGIN
    -- Drop the old constraint if it exists (usually named table_column1_column2_key)
    ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;
    
    -- Add the new unique constraint including variant_id
    -- Note: This allows multiple variants of the same product for the same user
    ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_user_id_product_id_variant_id_key UNIQUE (user_id, product_id, variant_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint update failed or already updated: %', SQLERRM;
END $$;
