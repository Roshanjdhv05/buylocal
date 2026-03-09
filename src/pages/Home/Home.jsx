import React, { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { calculateDistance } from '../../utils/distance';
import ProductCard from '../../components/ProductCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { MapPin, ArrowRight, ChevronRight, Store } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getRecentlyViewed } from '../../utils/recentlyViewed';

const Home = () => {
    const { profile } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.get('search') || '';

    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [loading, setLoading] = useState(true);
    const { location } = useLocation();
    const [reviews, setReviews] = useState([]);
    const [activeCategory, setActiveCategory] = useState('Trending Near You');

    useEffect(() => {
        let mounted = true;

        const initHome = async () => {
            if (mounted) setLoading(true);

            await fetchData();
            if (mounted) setLoading(false);
        };

        const fetchData = async () => {
            try {
                const { data: storesData } = await withTimeout(supabase.from('stores').select('*'), 30000, 'Home Fetch Stores');
                const { data: productsData } = await withTimeout(supabase.from('products').select('*'), 30000, 'Home Fetch Products');
                const { data: reviewsData } = await withTimeout(supabase.from('product_reviews').select('*'), 30000, 'Home Fetch Reviews');

                if (mounted) {
                    setStores(storesData || []);
                    setProducts(productsData || []);
                    setReviews(reviewsData || []);
                }
            } catch (e) {
                console.error('Fetch error:', e.message);
            }
        };

        initHome();
        setRecentlyViewed(getRecentlyViewed());
        return () => { mounted = false; };
    }, [profile]);

    // Process Data
    const nearestStores = stores
        .map(store => ({
            ...store,
            distance: location ? calculateDistance(location, { lat: store.lat, lng: store.lng }) : Infinity
        }))
        .sort((a, b) => {
            if (a.distance === b.distance) return 0;
            if (a.distance === Infinity) return 1;
            if (b.distance === Infinity) return -1;
            return a.distance - b.distance;
        })
        .slice(0, 8); // Top 8 nearest stores

    const isAnyStoreNear = nearestStores.some(s => s.distance <= 10); // 10km radius

    const enrichProduct = (product) => {
        const store = stores.find(s => s.id === product.store_id);
        const distance = location && store
            ? calculateDistance(location, { lat: store.lat, lng: store.lng })
            : Infinity;

        // Calculate rating
        const productReviews = reviews.filter(r => r.product_id === product.id);
        const avgRating = productReviews.length > 0
            ? productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length
            : 0;

        return { ...product, distance, storeName: store?.name, avgRating, reviewCount: productReviews.length };
    };

    const enrichedProducts = products.map(enrichProduct);

    // Search Logic
    const searchResults = searchQuery ? enrichedProducts.filter(p => {
        const query = searchQuery.toLowerCase();
        return (
            p.name?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.category?.toLowerCase().includes(query) ||
            p.storeName?.toLowerCase().includes(query)
        );
    }) : [];

    const recommendedProducts = [...enrichedProducts]
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8);

    const topRatedProducts = [...enrichedProducts]
        .filter(p => p.avgRating > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 8);

    const trendingProducts = [...enrichedProducts]
        .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
        .slice(0, 8);

    const productsUnder99 = enrichedProducts.filter(p => p.online_price < 99).slice(0, 4);
    const productsUnder199 = enrichedProducts.filter(p => p.online_price < 199).slice(0, 4);
    const productsUnder299 = enrichedProducts.filter(p => p.online_price < 299).slice(0, 4);

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    const categoryIcons = {
        'Men': (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#9333ea" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="5" r="3" />
                <path d="M12 9C9.5 9 8 10.5 8 12V17H10.5V23H13.5V17H16V12C16 10.5 14.5 9 12 9Z" />
            </svg>
        ),
        'Women': (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#9333ea" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="5" r="3" />
                <path d="M12 9L7 17H10V23H14V17H17L12 9Z" />
            </svg>
        ),
        'Kids': (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#9333ea" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" />
                <circle cx="8.5" cy="10" r="1.5" fill="white" />
                <circle cx="15.5" cy="10" r="1.5" fill="white" />
                <path d="M8 14.5C8 16.5 10 17.5 12 17.5C14 17.5 16 16.5 16 14.5H8Z" fill="white" />
                <path d="M12 3C10.5 4.5 11.5 5.5 12 6C12.5 6 13.5 4.5 12 3Z" fill="#9333ea" />
            </svg>
        ),
        'Others': (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#9333ea" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7.5" height="7.5" rx="1" />
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="1" />
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="1" />
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1" />
            </svg>
        )
    };

    const categories = [
        { name: 'Men', svg: categoryIcons['Men'] },
        { name: 'Women', svg: categoryIcons['Women'] },
        { name: 'Kids', svg: categoryIcons['Kids'] },
        { name: 'Others', svg: categoryIcons['Others'] }
    ];

    // If searching, show only search results
    if (searchQuery) {
        return (
            <div className="home-page">
                <Navbar />
                <main className="container main-content" style={{ paddingTop: '2rem' }}>
                    <div className="section-header">
                        <div className="title-group">
                            <h2>Search Results for "{searchQuery}"</h2>
                            <p>Found {searchResults.length} items matching your search</p>
                        </div>
                        {searchResults.length === 0 && (
                            <Link to="/" className="btn-primary">Clear Search</Link>
                        )}
                    </div>

                    {searchResults.length > 0 ? (
                        <div className="products-grid">
                            {searchResults.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3>No matches found</h3>
                            <p>Try checking your spelling or using different keywords.</p>
                        </div>
                    )}
                </main>
                <Footer />
                <style>{`
                    .home-page { background: #fafafa; min-height: 100vh; }
                    .products-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1.25rem;
                    }
                    @media (max-width: 640px) {
                        .products-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 0.75rem;
                        }
                    }
                    @media (min-width: 641px) {
                        .products-grid {
                            grid-template-columns: repeat(4, 1fr);
                            gap: 1rem;
                        }
                    }
                    @media (min-width: 1024px) {
                        .products-grid {
                            grid-template-columns: repeat(5, 1fr);
                            gap: 1.25rem;
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
    }

    return (
        <div className="home-page">
            <Navbar />

            {/* Hero Section */}
            <header className="hero-section">
                <div className="container hero-container">
                    <div className="hero-content">
                        <span className="hero-badge">LIMITED OFFER</span>
                        <h1>Local Fashion <br /> Deals of the Week</h1>
                        <p>Up to 40% off on boutique collections from creators in your neighborhood.</p>
                        <Link to="/stores" className="btn-hero">Shop Now</Link>
                    </div>
                </div>
            </header>

            {/* Category Navigation (Minimal Style) */}
            <div className="container category-nav-container">
                <div className="category-minimal-grid">
                    {categories.map(cat => (
                        <Link
                            key={cat.name}
                            to={`/category/${cat.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="category-icon-item"
                        >
                            <div className="category-base">
                                {cat.svg}
                            </div>
                            <span className="category-label">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </div>

            <main className="container main-content">
                {/* Nearby Stores */}
                <section className="section-block">
                    <div className="section-header">
                        <div className="title-group">
                            <h2>Nearby Stores</h2>
                            <p>
                                {location ? (
                                    isAnyStoreNear ? (
                                        'Discover the best-rated shops within walking distance'
                                    ) : (
                                        <span className="location-warning">
                                            No stores found right near you. Here are the nearest available stores:
                                        </span>
                                    )
                                ) : (
                                    'Discover the best shops in your area'
                                )}
                            </p>
                        </div>
                        <Link to="/stores" className="view-all">View All</Link>
                    </div>

                    <div className="stores-horizontal-scroll">
                        {nearestStores.length > 0 ? (
                            nearestStores.map(store => (
                                <Link to={`/${encodeURIComponent(store.name)}`} key={store.id} className="store-circle-card">

                                    <div className="store-circle-img">
                                        <img src={store.banner_url || 'https://via.placeholder.com/150'} alt={store.name} />
                                        {store.distance !== Infinity && (
                                            <span className="store-dist-badge">{store.distance.toFixed(1)} km</span>
                                        )}
                                    </div>
                                    <h4>{store.name}</h4>
                                    <span>{store.category || 'Local Shop'}</span>
                                </Link>
                            ))
                        ) : (
                            <div className="empty-inline-stores">
                                <Store size={32} opacity={0.2} />
                                <p>No stores nearby yet. Check back soon!</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recently Viewed Products */}
                {recentlyViewed.length > 0 && (
                    <section className="section-block">
                        <div className="section-header">
                            <div className="title-group">
                                <h2>Your Recently Viewed</h2>
                                <p>Pick up where you left off</p>
                            </div>
                        </div>
                        <div className="products-grid recently-viewed-grid products-slider">
                            {recentlyViewed.slice(0, 6).map(rv => {
                                // Find full enriched data
                                const fullProduct = enrichedProducts.find(p => p.id === rv.id) || rv;
                                return <ProductCard key={rv.id} product={fullProduct} />;
                            })}
                        </div>
                    </section>
                )}

                {/* Top Rated Products */}
                {topRatedProducts.length > 0 && (
                    <section className="section-block">
                        <div className="section-header">
                            <div className="title-group">
                                <h2>Top Rated Products</h2>
                                <p>Loved by your local community</p>
                            </div>
                            <Link to="/categories" className="view-all">View All</Link>
                        </div>
                        <div className="products-grid products-slider">
                            {topRatedProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Products */}
                <section className="section-block">
                    <div className="section-header">
                        <div className="title-group">
                            <h2>Trending Products</h2>
                            <p>Most popular items right now</p>
                        </div>
                        <Link to="/trending" className="view-all">View All</Link>
                    </div>
                    <div className="products-grid products-slider">
                        {trendingProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>

                {/* Price Based Sections */}
                <section className="section-block">
                    <div className="section-header">
                        <div className="title-group">
                            <h2>Budget Friendly Deals</h2>
                            <p>Great fashion doesn't have to be expensive</p>
                        </div>
                    </div>
                    <div className="price-segments-grid">
                        <Link to="/price-filter/99" className="price-segment-card bg-rose">
                            <h3>Under ₹99</h3>
                            <p>{productsUnder99.length} Items Available</p>
                            <ChevronRight size={24} />
                        </Link>
                        <Link to="/price-filter/199" className="price-segment-card bg-amber">
                            <h3>Under ₹199</h3>
                            <p>{productsUnder199.length} Items Available</p>
                            <ChevronRight size={24} />
                        </Link>
                        <Link to="/price-filter/299" className="price-segment-card bg-indigo">
                            <h3>Under ₹299</h3>
                            <p>{productsUnder299.length} Items Available</p>
                            <ChevronRight size={24} />
                        </Link>
                    </div>
                </section>

                {/* All Products */}
                <section className="section-block">
                    <div className="section-header">
                        <div className="title-group">
                            <h2>All Products</h2>
                            <p>Browse everything from your favorite local stores</p>
                        </div>
                    </div>
                    <div className="products-grid">
                        {enrichedProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            </main>

            {/* Business CTA */}
            <section className="business-cta">
                <div className="container cta-container">
                    <div className="cta-content">
                        <h2>Join BuyLocal <br /> for Business</h2>
                        <p>Are you a local shop owner? List your products and start delivering to customers in your area within hours. Expand your reach today.</p>
                        <div className="cta-buttons">
                            <Link to="/seller/signup" className="btn-white">Get Started Today</Link>
                            <Link to="/seller/signup" className="btn-outline">Learn More</Link>
                        </div>
                    </div>
                    <div className="cta-graphic">
                        <Store size={200} opacity={0.1} />
                    </div>
                </div>
            </section>

            <Footer />

            <style>{`
        .home-page { background: #fafafa; }
        
        /* Hero Section */
        .hero-section {
            background-image: url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80');
            background-size: cover;
            background-position: center;
            height: 500px;
            display: flex;
            align-items: center;
            position: relative;
        }
        .hero-section::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
        }
        .hero-container { position: relative; z-index: 1; }
        .hero-content { max-width: 600px; color: white; }
        .hero-badge {
            background: var(--primary);
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
            margin-bottom: 1rem;
        }
        .hero-content h1 {
            font-size: 3.5rem;
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 1rem;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .hero-content p {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            max-width: 480px;
        }
        .btn-hero {
            background: white;
            color: black;
            padding: 1rem 2rem;
            border-radius: 50px;
            font-weight: 700;
            transition: var(--transition);
            display: inline-block;
        }
        .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }

        /* Category Navigation (Minimal Style) */
        .category-nav-container { 
            margin: -2rem auto 2.5rem; /* Pull up to overlap hero slightly */
            background: transparent;
            position: relative;
            z-index: 10;
        }
        .category-minimal-grid {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
            padding: 0.75rem;
            background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(245,243,255,0.8));
            backdrop-filter: blur(10px);
            border-radius: 24px;
            max-width: fit-content;
            margin: 0 auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6);
        }
        @media (max-width: 640px) {
            .category-nav-container { margin-top: 1rem; }
            .category-minimal-grid {
                gap: 0.75rem;
                padding: 1rem 0.5rem;
                background: transparent;
                box-shadow: none;
                justify-content: space-around;
                width: 100%;
                max-width: 100%;
            }
        }
        
        .category-icon-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-decoration: none;
            width: 76px;
        }
        @media (max-width: 640px) {
            .category-icon-item {
                width: 60px;
            }
        }
        
        .category-base {
            width: 74px;
            height: 74px;
            background: #ffffff;
            border-radius: 22px; 
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 16px rgba(147, 51, 234, 0.12); /* Soft purple glow shadow */
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        @media (max-width: 640px) {
            .category-base {
                width: 56px;
                height: 56px;
                border-radius: 16px;
                margin-bottom: 0.5rem;
            }
            .category-base svg {
                transform: scale(0.8);
            }
        }
        
        .category-icon-item:hover .category-base {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(147, 51, 234, 0.2);
        }

        .category-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #0f172a;
            text-align: center;
            letter-spacing: -0.01em;
        }
        @media (max-width: 640px) {
            .category-label {
                font-size: 0.75rem;
            }
        }

        /* Section Block */
        .main-content { padding-bottom: 4rem; }
        .section-block { margin-bottom: 4rem; }
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 2rem;
        }
        .title-group h2 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.25rem; }
        .title-group p { color: var(--text-muted); }
        .view-all { color: var(--primary); font-weight: 700; font-size: 0.9rem; }

        /* Stores Horizontal Scroll */
        .stores-horizontal-scroll {
            display: flex;
            gap: 2rem;
            overflow-x: auto;
            padding: 1rem 0.5rem;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .stores-horizontal-scroll::-webkit-scrollbar { display: none; }
        
        .store-circle-card {
            flex: 0 0 100px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-decoration: none;
            transition: transform 0.2s;
        }
        .store-circle-card:hover { transform: translateY(-5px); }
        .store-circle-img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            margin-bottom: 0.5rem;
            position: relative;
            border: 2px solid white;
            box-shadow: var(--shadow-sm);
        }
        .store-circle-img img { width: 100%; height: 100%; object-fit: cover; }
        .store-dist-badge {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            background: var(--success);
            color: white;
            font-size: 0.65rem;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 700;
        }
        .store-circle-card h4 { font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.1rem; }
        .store-circle-card span { font-size: 0.65rem; color: var(--text-muted); }

        /* Products Grid */
        .products-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
        }
        @media (min-width: 641px) {
            .products-grid {
                grid-template-columns: repeat(4, 1fr);
                gap: 1rem;
            }
        }
        @media (min-width: 1024px) {
            .products-grid {
                grid-template-columns: repeat(5, 1fr);
                gap: 1.25rem;
            }
        }
        @media (min-width: 1440px) {
            .products-grid {
                grid-template-columns: repeat(7, 1fr);
            }
        }


        /* Business CTA */
        .business-cta {
            background: var(--grad-main);
            color: white;
            padding: 5rem 0;
            position: relative;
            overflow: hidden;
            margin-bottom: 0; /* Flush with footer */
        }
        .cta-container { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2; }
        .cta-content { max-width: 600px; }
        .cta-content h2 { font-size: 3rem; font-weight: 900; line-height: 1.1; margin-bottom: 1.5rem; }
        .cta-content p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2.5rem; line-height: 1.6; }
        .cta-buttons { display: flex; gap: 1rem; }
        .btn-white {
            background: white;
            color: var(--primary);
            padding: 0.75rem 1.75rem;
            border-radius: 50px;
            font-weight: 700;
            transition: var(--transition);
        }
        .btn-white:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .btn-outline {
            border: 2px solid white;
            color: white;
            padding: 0.75rem 1.75rem;
            border-radius: 50px;
            font-weight: 700;
            transition: var(--transition);
        }
        .btn-outline:hover { background: rgba(255,255,255,0.1); }
        
        .cta-graphic {
            position: absolute;
            right: -50px;
            bottom: -50px;
            transform: rotate(-15deg);
        }

        /* Price Segments */
        .price-segments-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .price-segment-card {
            padding: 2.5rem 2rem;
            border-radius: var(--radius-lg);
            color: white;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            transition: var(--transition);
            overflow: hidden;
            box-shadow: var(--shadow-md);
        }
        .price-segment-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
        .price-segment-card h3 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; position: relative; z-index: 2; }
        .price-segment-card p { opacity: 0.9; font-weight: 600; position: relative; z-index: 2; }
        .price-segment-card svg { position: absolute; right: 1.5rem; bottom: 1.5rem; opacity: 0.3; z-index: 2; transition: var(--transition); }
        .price-segment-card:hover svg { transform: translateX(5px); opacity: 0.5; }
        
        .price-segment-card::after {
            content: '';
            position: absolute;
            top: -20%; right: -10%;
            width: 150px; height: 150px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            z-index: 1;
        }

        .bg-rose { background: linear-gradient(135deg, #f43f5e, #fb7185); }
        .bg-amber { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
        .bg-indigo { background: linear-gradient(135deg, #6366f1, #818cf8); }

        @media (max-width: 900px) {
            .price-segments-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
            .hero-content h1 { font-size: 2.5rem; }
            .cta-content h2 { font-size: 2rem; }
            .cta-container { flex-direction: column; text-align: center; }
            .cta-buttons { justify-content: center; }
            .section-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
            .view-all { align-self: flex-end; }
        }

        @media (max-width: 640px) {
            .products-slider {
                display: flex !important;
                overflow-x: auto !important;
                gap: 1rem !important;
                padding: 0.5rem 0.25rem !important;
                scrollbar-width: none;
                -ms-overflow-style: none;
                scroll-snap-type: x mandatory;
                -webkit-overflow-scrolling: touch;
            }
            .products-slider::-webkit-scrollbar {
                display: none;
            }
            .products-slider > * {
                flex: 0 0 160px !important;
                scroll-snap-align: start;
            }
            .products-grid:not(.products-slider) {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 0.75rem;
            }
            /* Show all products inside slider on phone */
            .recently-viewed-grid > *:nth-child(n+5) {
                display: block;
            }
        }

        .location-warning {
            color: #f59e0b; /* Amber/Orange color */
            font-weight: 600;
        }

        @media (max-width: 640px) {
            .recently-viewed-grid, .products-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 0.75rem !important;
            }
        }
        @media (min-width: 641px) {
            .recently-viewed-grid, .products-grid:not(.recently-viewed-grid) {
                grid-template-columns: repeat(4, 1fr) !important;
                gap: 1rem;
            }
        }
        @media (min-width: 1024px) {
            .recently-viewed-grid, .products-grid:not(.recently-viewed-grid) {
                grid-template-columns: repeat(5, 1fr) !important;
            }
        }
        @media (min-width: 1440px) {
            .recently-viewed-grid, .products-grid:not(.recently-viewed-grid) {
                grid-template-columns: repeat(7, 1fr) !important;
            }
        }
            .empty-inline-stores {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem;
                background: #f1f5f9;
                border-radius: 16px;
                width: 100%;
                color: var(--text-muted);
                gap: 1rem;
                text-align: center;
            }
            .empty-inline-stores p { font-size: 0.9rem; font-weight: 600; }
      `}</style>
        </div>
    );
};

export default Home;
