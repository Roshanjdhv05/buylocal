import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import { Layers, ShoppingBag } from 'lucide-react';

const Categories = () => {
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('Men');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*, stores(name)');
        // Manual join-like formatting since we don't have location context here easily
        const formatted = (data || []).map(p => ({ ...p, storeName: p.stores?.name, distance: Infinity }));
        setProducts(formatted);
        setLoading(false);
    };

    const categories = ['Men', 'Women', 'Kids'];
    const filteredProducts = products.filter(p => p.category === activeTab);

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <div className="categories-page">
            <Navbar />

            <main className="container">
                <header className="page-header">
                    <h1>Explore Categories</h1>
                    <p>Find the best local fashion for everyone</p>
                </header>

                <div className="tabs-container">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`tab-btn ${activeTab === cat ? 'active' : ''}`}
                            onClick={() => setActiveTab(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="products-section">
                    <div className="products-grid">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="empty-state glass-card">
                            <ShoppingBag size={48} />
                            <h3>No products in {activeTab}</h3>
                            <p>Check back later for new arrivals.</p>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
        .categories-page { padding-bottom: 5rem; }
        .page-header { margin: 3rem 0; text-align: center; }
        .page-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .page-header p { color: var(--text-muted); }

        .tabs-container { 
          display: flex; 
          justify-content: center; 
          gap: 1rem; 
          margin-bottom: 3rem; 
          padding: 0.5rem;
          background: #f1f5f9;
          border-radius: var(--radius-lg);
          max-width: fit-content;
          margin-left: auto;
          margin-right: auto;
        }
        .tab-btn { 
          padding: 0.75rem 2.5rem; 
          border-radius: var(--radius-md); 
          font-weight: 700; 
          background: transparent;
          color: var(--text-muted);
          transition: var(--transition);
        }
        .tab-btn.active { 
          background: white; 
          color: var(--primary); 
          box-shadow: var(--shadow-sm);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }

        @media (max-width: 640px) {
            .products-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
            }
        }

        .empty-state { text-align: center; padding: 4rem 2rem; }
      `}</style>
        </div>
    );
};

export default Categories;
