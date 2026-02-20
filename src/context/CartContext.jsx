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
                    quantity,
                    product:products(
                        *,
                        stores(name)
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            if (data) {
                const formattedCart = data
                    .filter(item => item.product) // Filter out items with deleted products
                    .map(item => ({
                        ...item.product,
                        quantity: item.quantity,
                        storeName: item.product.stores?.name || 'Local Store'
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

    const addToCart = async (product, quantity = 1) => {
        if (user) {
            try {
                // Check if item exists
                const { data: existing } = await supabase
                    .from('cart_items')
                    .select('id, quantity')
                    .eq('user_id', user.id)
                    .eq('product_id', product.id)
                    .single();

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
                            quantity
                        }]);
                }
                fetchCart(); // Refresh from DB
            } catch (err) {
                console.error('Error adding to DB cart:', err.message);
            }
        } else {
            setCart(prevCart => {
                const existingItem = prevCart.find(item => item.id === product.id);
                if (existingItem) {
                    return prevCart.map(item =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                }
                return [...prevCart, { ...product, quantity }];
            });
        }
    };

    const removeFromCart = async (productId) => {
        if (user) {
            try {
                await supabase
                    .from('cart_items')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
                fetchCart();
            } catch (err) {
                console.error('Error removing from DB cart:', err.message);
            }
        } else {
            setCart(prevCart => prevCart.filter(item => item.id !== productId));
        }
    };

    const updateQuantity = async (productId, quantity) => {
        if (quantity < 1) return removeFromCart(productId);

        if (user) {
            try {
                await supabase
                    .from('cart_items')
                    .update({ quantity })
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
                fetchCart();
            } catch (err) {
                console.error('Error updating DB cart:', err.message);
            }
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.id === productId ? { ...item, quantity } : item
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

    const cartTotal = cart.reduce((total, item) => total + (item.online_price * item.quantity), 0);
    const cartCount = cart.length; // Count distinct products (lines) to avoid confusion

    return (
        <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
