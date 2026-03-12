import React, { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Wishlist = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchWishlist();
        }
    }, [user]);

    const fetchWishlist = async () => {
        try {
            // Fetch wishlist entries join with products
            const { data, error } = await withTimeout(supabase
                .from('wishlist')
                .select(`
                    id,
                    product_id,
                    products (*)
                `)
                .eq('user_id', user.id));

            if (error) throw error;

            // Extract products from the joined data
            const products = data.map(item => item.products).filter(p => p !== null);
            setWishlistItems(products);
        } catch (error) {
            console.error('Error fetching wishlist:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <div className="wishlist-page">
            <Navbar />

            <main className="container luxury-main">
                <div className="wishlist-header">
                    <div className="header-text">
                        <h1><Heart size={32} className="heart-icon-styled" /> {t('wishlist.title')}</h1>
                        <p>{t('wishlist.subtitle')}</p>
                    </div>
                    <Link to="/" className="btn-continue-shopping">
                        <ArrowLeft size={18} /> {t('wishlist.continueShopping')}
                    </Link>
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="empty-wishlist glass-card">
                        <Heart size={64} opacity={0.1} />
                        <h2>{t('wishlist.empty')}</h2>
                        <p>{t('wishlist.emptySubtitle')}</p>
                        <Link to="/" className="btn-primary">{t('wishlist.exploreProducts')}</Link>
                    </div>
                ) : (
                    <div className="products-grid">
                        {wishlistItems.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </main>

            <style>{`
                .wishlist-page { background: #fafafa; min-height: 100vh; padding-bottom: 5rem; }
                .luxury-main { padding-top: 3rem; }
                
                .wishlist-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-end; 
                    margin-bottom: 3rem; 
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid #eee;
                }
                
                .header-text h1 { 
                    font-size: 2.5rem; 
                    font-weight: 800; 
                    color: var(--text-main); 
                    display: flex; 
                    align-items: center; 
                    gap: 1rem;
                    letter-spacing: -0.02em;
                }
                .heart-icon-styled { color: #ef4444; }
                .header-text p { color: #64748b; font-size: 1.1rem; margin-top: 0.5rem; }
                
                .btn-continue-shopping {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--primary);
                    font-weight: 700;
                    font-size: 0.95rem;
                }

                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.5rem;
                }
                @media (min-width: 641px) {
                    .products-grid {
                        grid-template-columns: repeat(5, 1fr);
                        gap: 0.75rem;
                    }
                }
                @media (min-width: 1024px) {
                    .products-grid {
                        grid-template-columns: repeat(7, 1fr);
                    }
                }
                @media (min-width: 1440px) {
                    .products-grid {
                        grid-template-columns: repeat(7, 1fr);
                    }
                }

                .empty-wishlist {
                    padding: 5rem 2rem;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                    background: white;
                    border-radius: 24px;
                }
                .empty-wishlist h2 { font-size: 1.5rem; font-weight: 700; }
                .empty-wishlist p { color: #64748b; max-width: 400px; line-height: 1.6; }
                
                @media (max-width: 768px) {
                    .wishlist-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .header-text h1 { font-size: 2rem; }
                }
            `}</style>
        </div>
    );
};

export default Wishlist;
