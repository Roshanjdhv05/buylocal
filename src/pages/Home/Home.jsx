import React, { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { calculateDistance } from '../../utils/distance';
import ProductCard from '../../components/ProductCard';
import Navbar from '../../components/Navbar';
import { MapPin, Search, Filter, Package } from 'lucide-react';

const Home = () => {
    const { profile } = useAuth();
    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [location, setLocation] = useState(null);

    useEffect(() => {
        let mounted = true;

        const initHome = async () => {
            console.log('Home: Initializing...');

            // Handle Geolocation with timeout
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        if (mounted) {
                            console.log('Home: Geolocation success');
                            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        }
                    },
                    (err) => {
                        console.warn('Home: Geolocation failed or denied', err);
                        // Default to a fallback or just proceed without location
                    },
                    { timeout: 5000 }
                );
            }

            await fetchData();
            if (mounted) setLoading(false);
        };

        initHome();

        // Failsafe: Ensure loading ends after 10s no matter what
        const failsafe = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Home: Failsafe timeout reached. Forcing loading to false.');
                setLoading(false);
            }
        }, 10000);

        return () => {
            mounted = false;
            clearTimeout(failsafe);
        };
    }, [profile]);

    const fetchData = async () => {
        console.log('Home: Fetching data...');
        try {
            const { data: storesData, error: storesError } = await withTimeout(supabase.from('stores').select('*'));
            if (storesError) throw storesError;

            const { data: productsData, error: productsError } = await withTimeout(supabase.from('products').select('*'));
            if (productsError) throw productsError;

            setStores(storesData || []);
            setProducts(productsData || []);
            console.log('Home: Data fetched successfully');
        } catch (e) {
            console.error('Home: Fetch error:', e.message);
        }
    };

    // Logic: Sort products by store distance
    const sortedProducts = products
        .map(product => {
            const store = stores.find(s => s.id === product.store_id);
            const distance = location && store
                ? calculateDistance(location, { lat: store.lat, lng: store.lng })
                : Infinity;
            return { ...product, distance, storeName: store?.name };
        })
        .sort((a, b) => a.distance - b.distance);

    const filteredProducts = sortedProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const nearestStores = stores
        .map(store => ({
            ...store,
            distance: location ? calculateDistance(location, { lat: store.lat, lng: store.lng }) : Infinity
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <div className="home-page">
            <Navbar />

            <header className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>Local Shopping, <span>Fast Delivery</span></h1>
                        <p>Discover products from stores within 10km of your location.</p>

                        <div className="search-bar glass-card">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search products, categories, or stores..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="btn-primary">Search</button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container">
                {/* Nearest Stores Section */}
                {location && (
                    <section className="stores-section">
                        <div className="section-title">
                            <h2><MapPin size={24} /> Nearby Stores</h2>
                            <p>Top picks within your reach</p>
                        </div>
                        <div className="stores-scroll">
                            {nearestStores.map(store => (
                                <div key={store.id} className="store-pill glass-card">
                                    <div className="store-pill-img">
                                        <img src={store.banner_url || 'https://via.placeholder.com/150'} alt={store.name} />
                                    </div>
                                    <div className="store-pill-info">
                                        <h4>{store.name}</h4>
                                        <span>{store.distance.toFixed(1)} km away</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Products Grid */}
                <section className="products-section">
                    <div className="section-title">
                        <h2>Recommended for You</h2>
                        <div className="filters">
                            <button className="filter-btn"><Filter size={18} /> Sort by Distance</button>
                        </div>
                    </div>

                    <div className="products-grid">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="empty-state">
                            <Package size={48} />
                            <h3>No products found</h3>
                            <p>Try searching for something else or adjusting your filters.</p>
                        </div>
                    )}
                </section>
            </main>

            <style>{`
        .home-page { padding-bottom: 5rem; }
        .hero { 
          background: var(--grad-main); 
          padding: 6rem 0; 
          color: white; 
          text-align: center;
          margin-bottom: 3rem;
        }
        .hero-content h1 { font-size: 3.5rem; font-weight: 900; line-height: 1.1; margin-bottom: 1rem; }
        .hero-content h1 span { opacity: 0.9; }
        .hero-content p { font-size: 1.25rem; opacity: 0.9; margin-bottom: 3rem; }

        .search-bar {
          max-width: 700px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: white;
          color: var(--text-main);
        }
        .search-bar input { border: none; padding: 0.5rem; box-shadow: none; font-size: 1.125rem; }
        
        .section-title { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 2rem; 
        }
        .section-title h2 { display: flex; align-items: center; gap: 0.75rem; font-size: 1.75rem; }
        .section-title p { color: var(--text-muted); }

        /* Stores Scroll */
        .stores-scroll { 
          display: flex; 
          gap: 1.5rem; 
          overflow-x: auto; 
          padding: 0.5rem 0.25rem 2rem;
          scrollbar-width: none;
        }
        .stores-scroll::-webkit-scrollbar { display: none; }
        
        .store-pill { 
          flex: 0 0 280px; 
          display: flex; 
          align-items: center; 
          gap: 1rem; 
          padding: 1rem;
          background: white;
        }
        .store-pill-img { width: 60px; height: 60px; border-radius: 50%; overflow: hidden; }
        .store-pill-img img { width: 100%; height: 100%; object-fit: cover; }
        .store-pill-info h4 { font-size: 1rem; }
        .store-pill-info span { font-size: 0.875rem; color: var(--primary); font-weight: 600; }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 2rem;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          background: white;
          border: 1px solid var(--border);
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 5rem 0;
          color: var(--text-muted);
        }
        .empty-state svg { margin-bottom: 1.5rem; opacity: 0.3; }

        @media (max-width: 768px) {
          .hero-content h1 { font-size: 2.5rem; }
          .search-bar { flex-direction: column; padding: 1rem; }
          .search-bar button { width: 100%; }
        }
      `}</style>
        </div>
    );
};

export default Home;
