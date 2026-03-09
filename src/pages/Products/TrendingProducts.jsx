import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import { useLocation as useLocationContext } from '../../context/LocationContext';

const TrendingProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { location } = useLocationContext();

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, store:store_id (name, location, city)')
                    // Sort by newest products, since actual views metrics are missing from the DB
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Format the products to match what ProductCard expects (flatten storeName)
                const formattedProducts = (data || []).map(p => ({
                    ...p,
                    storeName: p.store ? p.store.name : 'Unknown Store'
                }));

                setProducts(formattedProducts);
            } catch (err) {
                console.error("Error fetching trending products:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrending();
    }, [location]); // Re-fetch or re-calculate distances if location changes

    return (
        <div className="trending-page">
            <Navbar />

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-dark)' }}>Trending Near You</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Most popular items in your lively neighborhood.</p>
                </div>

                {loading ? (
                    <div className="loader-container" style={{ minHeight: '50vh' }}>
                        <div className="loader"></div>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.length > 0 ? (
                            products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No trending products right now.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .trending-page {
                    background: #fafafa;
                    min-height: 100vh;
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
                        grid-template-columns: repeat(5, 1fr);
                    }
                }
                @media (min-width: 1440px) {
                    .products-grid {
                        grid-template-columns: repeat(7, 1fr);
                    }
                }
            `}</style>
        </div>
    );
};

export default TrendingProducts;
