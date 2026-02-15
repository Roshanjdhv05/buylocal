import { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../services/supabase';

/**
 * Custom hook to fetch product and its associated store data.
 * @param {string} productId - The unique identifier of the product.
 * @returns {Object} { product, store, loading, error }
 */
export const useProduct = (productId) => {
    const [product, setProduct] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchProductData = async () => {
            if (!productId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch Product
                const { data: productData, error: productError } = await withTimeout(
                    supabase
                        .from('products')
                        .select('*')
                        .eq('id', productId)
                        .single()
                );

                if (productError) {
                    if (productError.code === 'PGRST116') {
                        // Product not found
                        if (isMounted) {
                            setProduct(null);
                            setLoading(false);
                        }
                        return;
                    }
                    throw productError;
                }

                if (isMounted) {
                    setProduct(productData);
                }

                // Fetch Associated Store
                if (productData?.store_id) {
                    const { data: storeData, error: storeError } = await withTimeout(
                        supabase
                            .from('stores')
                            .select('*')
                            .eq('id', productData.store_id)
                            .single()
                    );

                    if (storeError) {
                        console.error('Error fetching store:', storeError);
                    } else if (isMounted) {
                        setStore(storeData);
                    }
                }

            } catch (err) {
                console.error('useProduct error:', err);
                if (isMounted) {
                    setError(err.message || 'An unexpected error occurred');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProductData();

        return () => {
            isMounted = false;
        };
    }, [productId]);

    return { product, store, loading, error };
};
