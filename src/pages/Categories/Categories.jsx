import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import { useLocation } from '../../context/LocationContext';
import {
    ShoppingBag,
    ArrowRight,
    Clock,
    Store,
    MapPin,
    ChevronRight,
    Search
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const Categories = () => {
    const { categoryName } = useParams();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [activeTab, setActiveTab] = useState(categoryName || 'All');
    const [loading, setLoading] = useState(true);
    const { location } = useLocation();

    // Sync activeTab when categoryName param changes
    useEffect(() => {
        if (categoryName) {
            setActiveTab(categoryName);
        }
    }, [categoryName]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleTabClick = (cat) => {
        setActiveTab(cat);
        navigate(`/category/${cat}`);
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const fetchData = async () => {
        try {
            const [productsRes, storesRes] = await Promise.all([
                supabase.from('products').select('*, stores(name, lat, lng)'),
                supabase.from('stores').select('*').limit(4)
            ]);

            const userLat = location?.lat;
            const userLng = location?.lng;

            const formattedProducts = (productsRes.data || []).map(p => ({
                ...p,
                storeName: p.stores?.name,
                distance: calculateDistance(userLat, userLng, p.stores?.lat, p.stores?.lng)
            }));

            const formattedStores = (storesRes.data || []).map(s => ({
                ...s,
                distance: calculateDistance(userLat, userLng, s.lat, s.lng)
            }));

            setProducts(formattedProducts);
            setStores(formattedStores);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', 'Men', 'Women', 'Kids', 'Others'];
    const filteredProducts = activeTab === 'All'
        ? products
        : products.filter(p => p.category === activeTab);

    const getBannerStyle = (tab) => {
        switch (tab) {
            case 'Men':
                return {
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%',
                };
            case 'Women':
                return {
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 20%',
                };
            case 'Kids':
                return {
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 40%',
                };
            default:
                return {
                    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)'
                };
        }
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <div className="categories-page">
            <Navbar />

            {/* Dynamic Category Banner */}
            <div className="category-banner" style={getBannerStyle(activeTab)}>
                <div className="container banner-content">
                    <h1>{activeTab === 'All' ? 'Explore Local Fashion' : `${activeTab}'s Collection`}</h1>
                    <p>{activeTab === 'All' ? 'Discover unique styles near you' : `Handpicked ${activeTab.toLowerCase()} fashion from your neighborhood`}</p>
                </div>
            </div>

            <main className="container">
                {/* Capsule Tabs */}
                <div className="tabs-scroll-wrapper">
                    <div className="tabs-capsule-container">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`capsule-tab-btn ${activeTab === cat ? 'active' : ''}`}
                                onClick={() => handleTabClick(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="content-area">
                    {/* Products Section */}
                    <div className="products-container">
                        {filteredProducts.length > 0 ? (
                            <div className="products-grid">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            /* Redesigned Empty State */
                            <div className="coming-soon-card">
                                <div className="icon-stack">
                                    <div className="store-circle">
                                        <Store size={40} color="#a855f7" />
                                    </div>
                                    <div className="clock-badge">
                                        <Clock size={16} color="white" />
                                    </div>
                                </div>
                                <h2>New styles coming soon</h2>
                                <p>
                                    Local stores are adding products for {activeTab}. <br />
                                    Check back in a few days or explore other categories.
                                </p>
                                {activeTab !== 'All' && (
                                    <button
                                        className="browse-alt-btn"
                                        onClick={() => handleTabClick('All')}
                                    >
                                        BROWSE ALL COLLECTIONS <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Discovery Sections - Only show on "All" (Discovery Mode) */}
                    {activeTab === 'All' && (
                        <>
                            {/* Popular Local Stores */}
                            <section className="stores-section">
                                <div className="section-header">
                                    <h2>Popular Local Stores</h2>
                                    <Link to="/stores" className="see-all">See all</Link>
                                </div>
                                <div className="stores-grid">
                                    {stores.map(store => (
                                        <Link to={`/${encodeURIComponent(store.name)}`} key={store.id} className="store-card-mini">
                                            <div className="store-images">
                                                <img src={store.banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"} alt="" />
                                                <img src={store.logo_url || "https://images.unsplash.com/photo-1441984908747-5c19ebb2c09c?w=400"} alt="" />
                                            </div>
                                            <div className="store-info-mini">
                                                <h3>{store.name}</h3>
                                                {store.distance !== Infinity && (
                                                    <span className="distance-tag">{store.distance.toFixed(1)} km away</span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>

                            {/* Trending Near You */}
                            <section className="trending-section">
                                <div className="section-header">
                                    <h2>Trending Near You</h2>
                                    <Link to="/trending" className="see-all">View All</Link>
                                </div>
                                <div className="products-grid">
                                    {products.slice(0, 4).map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </main>

            <style>{`
                .categories-page { 
                    padding-bottom: 6rem;
                    background: #fdfdfd; 
                }

                .category-banner {
                    background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
                    padding: 4rem 1rem;
                    color: white;
                    text-align: left;
                    margin-bottom: 2rem;
                }

                .banner-content h1 {
                    font-size: 2.25rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                }

                .banner-content p {
                    font-size: 1.1rem;
                    opacity: 0.9;
                }

                .tabs-scroll-wrapper {
                    overflow-x: auto;
                    padding-bottom: 0.5rem;
                    margin-bottom: 2rem;
                    -webkit-overflow-scrolling: touch;
                }
                .tabs-scroll-wrapper::-webkit-scrollbar { display: none; }

                .tabs-capsule-container {
                    display: flex;
                    gap: 1rem;
                    min-width: max-content;
                }

                .capsule-tab-btn {
                    padding: 0.6rem 1.75rem;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    background: white;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .capsule-tab-btn.active {
                    background: #a855f7;
                    color: white;
                    border-color: #a855f7;
                    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
                }

                .coming-soon-card {
                    background: white;
                    border-radius: 24px;
                    padding: 4rem 2rem;
                    text-align: center;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    margin-bottom: 4rem;
                }

                .icon-stack {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 2rem;
                }

                .store-circle {
                    width: 100%;
                    height: 100%;
                    background: #f5f3ff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .clock-badge {
                    position: absolute;
                    bottom: 5px;
                    right: 5px;
                    background: #a855f7;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 4px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .coming-soon-card h2 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 1rem;
                }

                .coming-soon-card p {
                    color: #64748b;
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }

                .browse-alt-btn {
                    color: #a855f7;
                    font-weight: 800;
                    font-size: 0.95rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin: 0 auto;
                    background: none;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .section-header h2 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #1e293b;
                }

                .see-all {
                    color: #a855f7;
                    font-weight: 700;
                    font-size: 0.9rem;
                }

                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.25rem;
                }

                .stores-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 3.5rem;
                }

                .store-card-mini {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid #f1f5f9;
                    transition: transform 0.2s ease;
                }

                .store-card-mini:hover {
                    transform: translateY(-4px);
                }

                .store-images {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    height: 120px;
                    gap: 2px;
                }

                .store-images img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .store-info-mini {
                    padding: 1rem;
                }

                .store-info-mini h3 {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.25rem;
                }

                .distance-tag {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    font-weight: 500;
                }

                .trending-section .products-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.25rem;
                }

                @media (max-width: 640px) {
                    .category-banner { padding: 3rem 1.25rem; }
                    .banner-content h1 { font-size: 1.75rem; }
                    
                    .stores-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.75rem;
                    }
                    .store-images { height: 90px; }
                    
                    .trending-section .products-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.75rem;
                    }

                    .coming-soon-card { padding: 3rem 1.25rem; }
                }
            `}</style>
        </div>
    );
};

export default Categories;
