import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load cart from DB if logged in, otherwise from localStorage
    const fetchCart = useCallback(async () => {
        if (!user) {
            const savedCart = localStorage.getItem('buylocal_cart');
            try {
                setCart(savedCart ? JSON.parse(savedCart) : []);
            } catch (e) {
                console.error('Error parsing cart from localStorage:', e);
                setCart([]);
            }
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('cart_items')
                .select(`
                    id,
                    variant_id,
                    quantity,
                    product:products(
                        *,
                        stores(name, delivery_charges, free_delivery_threshold),
                        product_variants(*)
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            if (data) {
                const formattedCart = data
                    .filter(item => item.product) // Filter out items with deleted products
                    .map(item => ({
                        ...item.product,
                        cartItemId: item.id,
                        quantity: item.quantity,
                        variant_id: item.variant_id,
                        selectedVariant: item.product.product_variants?.find(v => v.id === item.variant_id),
                        storeName: item.product.stores?.name || 'Local Store',
                        storeDeliveryCharges: item.product.stores?.delivery_charges || 0,
                        storeFreeThreshold: item.product.stores?.free_delivery_threshold || null
                    }));
                setCart(formattedCart);
            }
        } catch (err) {
            console.error('Error fetching cart from DB:', err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Sync local changes to localStorage ONLY for guest users
    useEffect(() => {
        if (!user) {
            localStorage.setItem('buylocal_cart', JSON.stringify(cart));
        } else {
            // Clear local storage when logged in to prevent overlap on next device session
            localStorage.removeItem('buylocal_cart');
        }
    }, [cart, user]);

    const addToCart = async (product, quantity = 1, variant = null) => {
        if (user) {
            try {
                // Check if item exists with same variant
                let query = supabase
                    .from('cart_items')
                    .select('id, quantity')
                    .eq('user_id', user.id)
                    .eq('product_id', product.id);
                
                if (variant) {
                    query = query.eq('variant_id', variant.id);
                } else {
                    query = query.is('variant_id', null);
                }

                const { data: existing } = await query.single();

                if (existing) {
                    await supabase
                        .from('cart_items')
                        .update({ quantity: existing.quantity + quantity })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('cart_items')
                        .insert([{
                            user_id: user.id,
                            product_id: product.id,
                            variant_id: variant?.id || null,
                            quantity
                        }]);
                }
                fetchCart(); // Refresh from DB
            } catch (err) {
                console.error('Error adding to DB cart:', err.message);
            }
        } else {
            setCart(prevCart => {
                const existingItem = prevCart.find(item => 
                    item.id === product.id && 
                    (variant ? item.variant_id === variant.id : !item.variant_id)
                );
                if (existingItem) {
                    return prevCart.map(item =>
                        (item.id === product.id && (variant ? item.variant_id === variant.id : !item.variant_id))
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                }
                const cartItemId = `${product.id}-${variant?.id || 'base'}-${Date.now()}`;
                return [...prevCart, { 
                    ...product, 
                    cartItemId,
                    quantity, 
                    variant_id: variant?.id || null, 
                    selectedVariant: variant,
                    storeName: product.stores?.name,
                    storeDeliveryCharges: product.stores?.delivery_charges,
                    storeFreeThreshold: product.stores?.free_delivery_threshold
                }];
            });
        }
    };

    const removeFromCart = async (productId, variantId = null) => {
        if (user) {
            try {
                let query = supabase
                    .from('cart_items')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
                
                if (variantId) {
                    query = query.eq('variant_id', variantId);
                } else {
                    query = query.is('variant_id', null);
                }

                await query;
                fetchCart();
            } catch (err) {
                console.error('Error removing from DB cart:', err.message);
            }
        } else {
            setCart(prevCart => prevCart.filter(item => 
                !(item.id === productId && (variantId ? item.variant_id === variantId : !item.variant_id))
            ));
        }
    };

    const updateQuantity = async (productId, quantity, variantId = null) => {
        if (quantity < 1) return removeFromCart(productId, variantId);

        if (user) {
            try {
                let query = supabase
                    .from('cart_items')
                    .update({ quantity })
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
                
                if (variantId) {
                    query = query.eq('variant_id', variantId);
                } else {
                    query = query.is('variant_id', null);
                }

                await query;
                fetchCart();
            } catch (err) {
                console.error('Error updating DB cart:', err.message);
            }
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    (item.id === productId && (variantId ? item.variant_id === variantId : !item.variant_id)) 
                        ? { ...item, quantity } 
                        : item
                )
            );
        }
    };

    const clearCart = async () => {
        if (user) {
            try {
                await supabase
                    .from('cart_items')
                    .delete()
                    .eq('user_id', user.id);
                fetchCart();
            } catch (err) {
                console.error('Error clearing DB cart:', err.message);
            }
        } else {
            setCart([]);
        }
    };

    const cartTotal = cart.reduce((total, item) => {
        const price = item.selectedVariant?.price || item.online_price || item.price || 0;
        return total + (price * item.quantity);
    }, 0);
    const cartCount = cart.length; // Count distinct products (lines) to avoid confusion

    return (
        <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
