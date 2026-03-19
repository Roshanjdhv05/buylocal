import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { Store, MapPin, ArrowRight, Heart, ChevronLeft, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';

const FollowedStores = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [stores, setStores] = useState([]);
    const [products, setProducts] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (user) {
            fetchAllData();
        }
    }, [user]);

    const handleNext = () => {
        const totalBanners = getBanners().length;
        if (totalBanners > 0) {
            setCurrentBannerIndex((prev) => (prev + 1) % totalBanners);
        }
    };

    const handlePrev = () => {
        const totalBanners = getBanners().length;
        if (totalBanners > 0) {
            setCurrentBannerIndex((prev) => (prev - 1 + totalBanners) % totalBanners);
        }
    };

    useEffect(() => {
        const totalBanners = getBanners().length;
        if (totalBanners <= 1 || isPaused) return;

        const timer = setInterval(() => {
            handleNext();
        }, 5000);

        return () => clearInterval(timer);
    }, [campaigns, stores, currentBannerIndex, isPaused]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Fetch followed stores
            const { data: followData, error: followError } = await withTimeout(supabase
                .from('store_follows')
                .select(`store_id, stores (*)` )
                .eq('user_id', user.id), 30000);

            if (followError) throw followError;

            const followedStores = followData.map(item => item.stores).filter(s => s !== null);
            setStores(followedStores);

            if (followedStores.length > 0) {
                const storeIds = followedStores.map(s => s.id);

                // 2. Fetch products from these stores
                const { data: productData, error: productError } = await withTimeout(supabase
                    .from('products')
                    .select('*')
                    .in('store_id', storeIds), 30000);
                
                if (productError) throw productError;
                setProducts(productData || []);

                // 3. Fetch active campaigns for these stores
                const { data: campaignData, error: campaignError } = await supabase
                    .from('banner_campaigns')
                    .select('*, stores(name)')
                    .eq('is_active', true)
                    .in('store_id', storeIds);
                
                if (!campaignError) {
                    setCampaigns(campaignData || []);
                }
            }
        } catch (error) {
            console.error('Error fetching followed store data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const getBanners = () => {
        const storeBanners = stores
            .filter(s => s.banner_url)
            .map(s => ({
                id: s.id,
                banner_url: s.banner_url,
                store_name: s.name,
                is_campaign: false
            }));
        
        const campaignBanners = campaigns.map(c => ({
            id: c.id,
            banner_url: isMobile && c.mobile_banner_url ? c.mobile_banner_url : c.banner_url,
            store_name: c.stores?.name,
            is_campaign: true
        }));

        return [...campaignBanners, ...storeBanners];
    };

    const banners = getBanners();

    // Categorization logic
    const sortedProducts = [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const newArrivals = sortedProducts.slice(0, 8);
    
    // Simple trending logic: products from stores with high rating or just next batch
    const trendingProducts = sortedProducts.slice(8, 16);
    
    // Remaining products shuffled
    const shopMoreProducts = sortedProducts.slice(16).sort(() => Math.random() - 0.5);

    if (loading) return <LoadingSpinner fullPage />;

    return (
        <div className="followed-stores-page">
            <Navbar />
            
            {/* Hero Section */}
            {banners.length > 0 && (
                <section className="hero-section">
                    <div className="banner-carousel">
                        <div 
                            className="banner-track"
                            style={{ 
                                transform: `translateX(-${currentBannerIndex * 100}%)`,
                                transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {banners.map((banner, index) => (
                                <div 
                                    key={banner.id + index} 
                                    className={`banner-slide ${index === currentBannerIndex ? 'active' : ''}`}
                                    style={{ backgroundImage: `url(${banner.banner_url})` }}
                                >
                                    <Link to={`/${encodeURIComponent(banner.store_name)}`} className="banner-link-overlay" />
                                    <div className="banner-overlay-content">
                                        <span className="banner-badge">{banner.is_campaign ? t('followedStores.featuredBadge') : t('followedStores.followedBadge')}</span>
                                        <h2>{banner.store_name}</h2>
                                        <p>Explore the latest collections from your favorite store.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {banners.length > 1 && (
                            <>
                                <button className="carousel-nav prev" onClick={handlePrev}><ChevronLeft /></button>
                                <button className="carousel-nav next" onClick={handleNext}><ChevronRight /></button>
                                <div className="carousel-dots">
                                    {banners.map((_, i) => (
                                        <button 
                                            key={i} 
                                            className={`dot ${i === currentBannerIndex ? 'active' : ''}`}
                                            onClick={() => setCurrentBannerIndex(i)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}

            <main className="container main-content-followed">
                {/* Followed Store List (Circle Avatars) */}
                <section className="section-block-followed">
                    <div className="section-header-luxury">
                        <div className="title-wrap">
                            <Heart size={24} className="icon-heart" fill="var(--secondary)" />
                            <h2>{t('followedStores.title')}</h2>
                        </div>
                        <Link to="/stores" className="view-all-luxury">{t('followedStores.exploreStores')} <ArrowRight size={16} /></Link>
                    </div>
                    
                    <div className="stores-circle-scroll">
                        {stores.map(store => (
                            <Link to={`/${encodeURIComponent(store.name)}`} key={store.id} className="store-circle-item">
                                <div className="circle-img-wrap">
                                    {store.profile_picture_url ? (
                                        <img src={store.profile_picture_url} alt={store.name} />
                                    ) : (
                                        <div className="avatar-placeholder">{store.name?.substring(0,2).toUpperCase()}</div>
                                    )}
                                </div>
                                <span>{store.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* New Arrivals Section */}
                {newArrivals.length > 0 && (
                    <section className="section-block-followed">
                        <div className="section-header-luxury">
                            <div className="title-wrap">
                                <Sparkles size={24} className="icon-sparkle" />
                                <h2>{t('followedStores.newArrivals')}</h2>
                            </div>
                            <p className="subtitle-luxury">Fresh picks from stores you follow</p>
                        </div>
                        <div className="products-horizontal-scroll">
                            {newArrivals.map(product => (
                                <div key={product.id} className="product-scroll-card">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Section */}
                {trendingProducts.length > 0 && (
                    <section className="section-block-followed">
                        <div className="section-header-luxury">
                            <div className="title-wrap">
                                <TrendingUp size={24} className="icon-trend" />
                                <h2>{t('followedStores.trending')}</h2>
                            </div>
                            <p className="subtitle-luxury">Most loved across your community</p>
                        </div>
                        <div className="products-horizontal-scroll">
                            {trendingProducts.map(product => (
                                <div key={product.id} className="product-scroll-card">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Shop More (Grid) */}
                {products.length === 0 ? (
                    <div className="empty-state-luxury glass-card">
                        <Store size={64} />
                        <h3>{t('followedStores.emptyTitle')}</h3>
                        <p>{t('followedStores.emptyDescNew')}</p>
                        <Link to="/stores" className="btn-luxury-primary">{t('followedStores.findStores')}</Link>
                    </div>
                ) : (
                    <section className="section-block-followed">
                        <div className="section-header-luxury">
                            <h2>{t('followedStores.shopMore')}</h2>
                            <p className="subtitle-luxury">A mix of everything you love</p>
                        </div>
                        <div className="products-grid-followed">
                            {[...newArrivals, ...trendingProducts, ...shopMoreProducts].map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <Footer />

            <style>{`
                .followed-stores-page { background: #fafafa; min-height: 100vh; }
                
                /* HERO SECTION */
                .hero-section { height: 450px; position: relative; overflow: hidden; background: #000; }
                .banner-carousel { height: 100%; position: relative; }
                .banner-track { display: flex; height: 100%; width: 100%; transition: transform 0.8s ease; }
                .banner-slide { flex: 0 0 100%; height: 100%; background-size: cover; background-position: center; position: relative; display: flex; align-items: flex-end; padding: 4rem; }
                .banner-slide::before { content: ''; position: absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%); }
                .banner-link-overlay { position: absolute; top:0; left:0; width:100%; height:100%; z-index: 1; }
                .banner-overlay-content { position: relative; z-index: 2; color: #fff; max-width: 600px; }
                .banner-badge { background: var(--secondary); color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem; display: inline-block; }
                .banner-overlay-content h2 { font-size: 3rem; font-weight: 800; margin-bottom: 0.5rem; }
                .banner-overlay-content p { font-size: 1.1rem; opacity: 0.9; }

                .carousel-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.2); border: none; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; z-index:10; backdrop-filter: blur(5px); }
                .carousel-nav.prev { left: 2rem; }
                .carousel-nav.next { right: 2rem; }
                .carousel-dots { position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5rem; z-index: 10; }
                .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3); border: none; cursor: pointer; }
                .dot.active { background: #fff; width: 24px; border-radius: 4px; }

                /* MAIN CONTENT */
                .main-content-followed { padding: 3rem 1rem; }
                .section-block-followed { margin-bottom: 4rem; }
                
                .section-header-luxury { margin-bottom: 2rem; }
                .title-wrap { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
                .section-header-luxury h2 { font-size: 1.8rem; font-weight: 800; color: #1a1a1a; margin: 0; }
                .subtitle-luxury { color: #666; font-size: 1rem; }
                .view-all-luxury { display: flex; align-items: center; gap: 0.5rem; color: var(--secondary); font-weight: 600; text-decoration: none; font-size: 0.9rem; }
                
                .icon-heart { color: #ff4757; }
                .icon-sparkle { color: #ffa502; }
                .icon-trend { color: #2ed573; }

                /* CIRCLE STORES */
                .stores-circle-scroll { display: flex; gap: 2rem; overflow-x: auto; padding: 1rem 0; scrollbar-width: none; }
                .stores-circle-scroll::-webkit-scrollbar { display: none; }
                .store-circle-item { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; text-decoration: none; min-width: 90px; }
                .circle-img-wrap { width: 85px; height: 85px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; transition: 0.3s; }
                .circle-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
                .avatar-placeholder { width: 100%; height: 100%; background: #eee; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #999; }
                .store-circle-item span { font-size: 0.9rem; font-weight: 600; color: #333; text-align: center; }
                .store-circle-item:hover .circle-img-wrap { transform: scale(1.05); box-shadow: 0 8px 25px rgba(0,0,0,0.15); border-color: var(--secondary); }

                /* HORIZONTAL PRODUCTS */
                .products-horizontal-scroll { display: flex; gap: 1.5rem; overflow-x: auto; padding: 1rem 0; scrollbar-width: none; }
                .products-horizontal-scroll::-webkit-scrollbar { display: none; }
                .product-scroll-card { flex: 0 0 240px; }

                /* PRODUCT GRID */
                .products-grid-followed { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 2rem; }

                @media (max-width: 768px) {
                    .hero-section { height: 350px; }
                    .banner-slide { padding: 2rem; }
                    .banner-overlay-content h2 { font-size: 2rem; }
                    .banner-overlay-content p { font-size: 0.9rem; }
                    .circle-img-wrap { width: 70px; height: 70px; }
                    .products-horizontal-scroll { gap: 1rem; }
                    .product-scroll-card { flex: 0 0 180px; }
                    .products-grid-followed { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
                }

                .empty-state-luxury { text-align: center; padding: 5rem 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .btn-luxury-primary { background: var(--secondary); color: #fff; padding: 0.8rem 2rem; border-radius: 50px; text-decoration: none; font-weight: 700; transition: 0.3s; }
                .btn-luxury-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
};

export default FollowedStores;
