import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import ProductCard from '../../components/ProductCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ArrowLeft, ShoppingBag, Filter } from 'lucide-react';

const PriceFilter = () => {
    const { maxPrice } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFilteredProducts = async () => {
            try {
                const { data: productsData } = await withTimeout(
                    supabase.from('products')
                        .select('*')
                        .lte('online_price', parseFloat(maxPrice))
                );

                const { data: storesData } = await withTimeout(
                    supabase.from('stores').select('id, name')
                );

                const formatted = (productsData || []).map(p => {
                    const store = (storesData || []).find(s => s.id === p.store_id);
                    return { ...p, storeName: store?.name, distance: Infinity };
                });

                setProducts(formatted);
                setStores(storesData || []);
            } catch (err) {
                console.error('Error fetching filtered products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFilteredProducts();
    }, [maxPrice]);

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <div className="price-filter-page">
            <Navbar />

            <main className="container">
                <header className="page-header">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <ArrowLeft size={20} /> Back
                    </button>
                    <div className="header-content">
                        <h1>Products Under ₹{maxPrice}</h1>
                        <p>Found {products.length} special deals for you</p>
                    </div>
                </header>

                <div className="products-section">
                    <div className="products-grid">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {products.length === 0 && (
                        <div className="empty-state glass-card">
                            <ShoppingBag size={48} />
                            <h3>No products found under ₹{maxPrice}</h3>
                            <p>Try exploring our other categories for more local deals.</p>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                .price-filter-page { padding-bottom: 5rem; background: #fafafa; min-height: 100vh; }
                .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
                .page-header { margin: 2rem 0; display: flex; flex-direction: column; gap: 1.5rem; }
                .back-btn { background: transparent; display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-weight: 600; width: fit-content; }
                .header-content h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
                .header-content p { color: var(--text-muted); }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 2rem;
                    margin-top: 2rem;
                }
                .empty-state { text-align: center; padding: 5rem 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--text-muted); }
                
                @media (max-width: 640px) {
                    .products-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 0.75rem;
                    }
                }
            `}</style>
            <Footer />
        </div>
    );
};

export default PriceFilter;
