import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    ShoppingCart, MapPin, Phone, Clock, ArrowLeft, Store,
    UserCheck, MessageSquare, Package, Star, CreditCard, ChevronRight,
    Award, ShieldCheck, Globe, Instagram, Twitter, Facebook
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';

const PublicStore = () => {
    const { user } = useAuth(); // Get user for follow logic
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        fetchStoreProfile();
        if (user) {
            checkIfFollowing();
        }
    }, [storeId, user]);

    const checkIfFollowing = async () => {
        const { data } = await supabase
            .from('store_follows')
            .select('*')
            .eq('store_id', storeId)
            .eq('user_id', user.id)
            .single();

        setIsFollowing(!!data);
    };

    const toggleFollow = async () => {
        if (!user) return alert('Please login to follow stores');
        setFollowLoading(true);
        try {
            if (isFollowing) {
                const { error } = await supabase
                    .from('store_follows')
                    .delete()
                    .eq('store_id', storeId)
                    .eq('user_id', user.id);
                if (error) throw error;
                setIsFollowing(false);
            } else {
                const { error } = await supabase
                    .from('store_follows')
                    .insert([{ store_id: storeId, user_id: user.id }]);
                if (error) throw error;
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Follow action failed:', error.message);
            alert('Action failed');
        } finally {
            setFollowLoading(false);
        }
    };

    const fetchStoreProfile = async () => {
        try {
            const { data: storeData, error: storeError } = await withTimeout(supabase
                .from('stores')
                .select('*')
                .eq('id', storeId)
                .single());

            if (storeError) throw storeError;
            setStore(storeData);

            const { data: productsData } = await withTimeout(supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId));

            setProducts(productsData || []);
        } catch (error) {
            console.error('Error fetching store profile:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (!store) return <div className="error-container">Store not found</div>;

    return (
        <div className="luxury-store-wrapper">
            <Navbar />

            {/* LUXURY HERO SECTION */}
            <div className="luxury-hero">
                <div className="hero-banner-wrap">
                    {store.banner_url ? (
                        <img src={store.banner_url} alt={store.name} className="hero-banner-img" />
                    ) : (
                        <div className="hero-banner-placeholder"></div>
                    )}
                    <div className="hero-overlay"></div>
                </div>

                <div className="hero-content container">
                    <div className="store-header-main">
                        <div className="store-brand-box">
                            <div className="store-logo-large">
                                {store.banner_url ? (
                                    <Store size={40} color="var(--primary)" />
                                ) : (
                                    store.name.charAt(0)
                                )}
                            </div>
                            <div className="store-title-wrap">
                                <h1>{store.name}</h1>
                                <p className="store-tagline">Curated Luxury Fashion & Artistry</p>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <button className={`btn-follow ${isFollowing ? 'following' : ''}`} onClick={toggleFollow} disabled={followLoading}>
                                {isFollowing ? <UserCheck size={18} /> : <UserCheck size={18} />}
                                {isFollowing ? 'Following' : 'Follow Store'}
                            </button>
                            <button className="btn-contact-concierge">
                                <MessageSquare size={18} /> Contact Concierge
                            </button>
                            {store.whatsapp && (
                                <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-contact-concierge" style={{ background: '#25D366' }}>
                                    <MessageSquare size={18} /> WhatsApp
                                </a>
                            )}
                            {store.instagram && (
                                <a href={`https://instagram.com/${store.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="btn-contact-concierge" style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}>
                                    <Instagram size={18} /> Instagram
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK STATS BAR */}
            <div className="stats-bar-container container">
                <div className="stats-grid-refined">
                    <div className="stat-item-luxury glass-card">
                        <div className="stat-icon-wrap blue">
                            <Package size={20} />
                        </div>
                        <div className="stat-texts">
                            <label>Total Products</label>
                            <p>{products.length}+</p>
                        </div>
                    </div>
                    <div className="stat-item-luxury glass-card">
                        <div className="stat-icon-wrap green">
                            <Clock size={20} />
                        </div>
                        <div className="stat-texts">
                            <label>Delivery Days</label>
                            <p>{store.delivery_time || '2 - 3 Days'}</p>
                        </div>
                    </div>
                    <div className="stat-item-luxury glass-card">
                        <div className="stat-icon-wrap gold">
                            <CreditCard size={20} />
                        </div>
                        <div className="stat-texts">
                            <label>COD Facility</label>
                            <p>Available</p>
                        </div>
                    </div>
                    <div className="stat-item-luxury glass-card">
                        <div className="stat-icon-wrap purple">
                            <Star size={20} />
                        </div>
                        <div className="stat-texts">
                            <label>Customer Rating</label>
                            <p>4.85 / 5.0</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container luxury-main">
                {/* MULTIMEDIA GALLERY SLIDER (Replaces Featured Collections) */}
                {store?.gallery_urls?.length > 0 && (
                    <section className="luxury-section gallery-slider-section">
                        <div className="section-header-luxury">
                            <div>
                                <h2>Store Gallery</h2>
                                <p className="sub-header">A glimpse into our curated world</p>
                            </div>
                            <div className="scroll-controls">
                                <button className="control-btn" onClick={() => {
                                    const container = document.getElementById('gallery-slider');
                                    container.scrollBy({ left: -400, behavior: 'smooth' });
                                }}><ArrowLeft size={16} /></button>
                                <button className="control-btn" onClick={() => {
                                    const container = document.getElementById('gallery-slider');
                                    container.scrollBy({ left: 400, behavior: 'smooth' });
                                }}><ChevronRight size={16} /></button>
                            </div>
                        </div>

                        <div className="multimedia-slider-wrap" id="gallery-slider">
                            {store.gallery_urls.map((url, idx) => {
                                const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video');
                                return (
                                    <div key={idx} className="multimedia-card glass-card">
                                        {isVideo ? (
                                            <video
                                                src={url}
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                                className="slider-media"
                                            />
                                        ) : (
                                            <img src={url} alt={`Gallery ${idx}`} className="slider-media" />
                                        )}
                                        <div className="media-overlay">
                                            <label>Gallery {idx + 1}</label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* DYNAMIC SECTIONS / PRODUCTS */}
                {Object.entries(products.reduce((acc, product) => {
                    const sectionName = product.section?.trim() || 'General Collection';
                    if (!acc[sectionName]) acc[sectionName] = [];
                    acc[sectionName].push(product);
                    return acc;
                }, {})).sort(([a], [b]) => {
                    if (a === 'General Collection') return 1;
                    if (b === 'General Collection') return -1;
                    return a.localeCompare(b);
                }).map(([sectionName, sectionProducts]) => (
                    <section key={sectionName} className="luxury-section" id={`section-${sectionName.replace(/\s+/g, '-').toLowerCase()}`}>
                        <div className="section-header-luxury">
                            <div>
                                <h2>{sectionName}</h2>
                                <p className="sub-header">Curated pieces from our {sectionName.toLowerCase()} selection</p>
                            </div>
                            <div className="scroll-controls">
                                <button className="control-btn"><ArrowLeft size={16} /></button>
                                <button className="control-btn"><ChevronRight size={16} /></button>
                            </div>
                        </div>

                        <div className="products-grid">
                            {sectionProducts.map(product => (
                                <ProductCard key={product.id} product={{ ...product, storeName: store.name }} />
                            ))}
                        </div>
                        <div className="debug-marker" style={{ fontSize: '0.6rem', color: '#eee', marginTop: '10px' }}>v1.1 (Section Grouping Active)</div>
                    </section>
                ))}

                {products.length === 0 && (
                    <section className="luxury-section">
                        <div className="empty-state-luxury glass-card">
                            <Store size={48} opacity={0.3} />
                            <p>No pieces curated yet.</p>
                        </div>
                    </section>
                )}

                {/* OUR LEGACY SECTION */}
                <section className="legacy-section-wrap glass-card">
                    <div className="legacy-content">
                        <div className="legacy-text">
                            <h2>Our Legacy</h2>
                            <p>Founded in the heart of artistry, {store.name} has been a beacon of luxury craftsmanship for over three decades. We bridge the gap between traditional artistry and modern sophistication, ensuring every piece in our marketplace meets the highest standards of quality and ethical production.</p>

                            <div className="legacy-stats">
                                <div className="l-stat">
                                    <h3>32</h3>
                                    <label>Years of Heritage</label>
                                </div>
                                <div className="l-stat">
                                    <h3>14</h3>
                                    <label>Global Boutiques</label>
                                </div>
                                <div className="l-stat">
                                    <h3>100%</h3>
                                    <label>Hand-Picked</label>
                                </div>
                            </div>
                        </div>
                        <div className="legacy-visual">
                            <div className="legacy-shape"></div>
                        </div>
                    </div>
                </section>

                {/* TESTIMONIALS */}
                <section className="luxury-section">
                    <div className="testimonials-wrap">
                        <div className="testimonial-header">
                            <h2>Client Testimonials</h2>
                        </div>
                        <div className="testimonial-card-luxury">
                            <div className="quote-icon"><MessageSquare size={24} /></div>
                            <div className="stars-row">
                                <Star size={16} fill="var(--primary)" color="var(--primary)" />
                                <Star size={16} fill="var(--primary)" color="var(--primary)" />
                                <Star size={16} fill="var(--primary)" color="var(--primary)" />
                                <Star size={16} fill="var(--primary)" color="var(--primary)" />
                                <Star size={16} fill="var(--primary)" color="var(--primary)" />
                            </div>
                            <p className="t-text">"The white-glove service provided by {store.name} is unparalleled. My sapphire necklace arrived in pristine condition, gift wrapped to perfection."</p>
                            <div className="t-author">
                                <div className="author-avatar">{store.name.charAt(0)}</div>
                                <div className="author-info">
                                    <strong>Elena V.</strong>
                                    <label>Verified Purchase</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <style>{`
                .luxury-store-wrapper { background: #fff; min-height: 100vh; padding-bottom: 8rem; color: #1a1a1a; font-family: 'Inter', sans-serif; }
                
                /* HERO */
                .luxury-hero { position: relative; height: 65vh; display: flex; align-items: flex-end; overflow: hidden; }
                .hero-banner-wrap { position: absolute; inset: 0; z-index: 1; }
                .hero-banner-img { width: 100%; height: 100%; object-fit: cover; }
                .hero-banner-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); }
                .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%); }
                
                .hero-content { position: relative; z-index: 10; padding-bottom: 4rem; color: white; }
                .store-header-main { display: flex; justify-content: space-between; align-items: flex-end; }
                .store-brand-box { display: flex; gap: 2rem; align-items: center; }
                .store-logo-large { 
                    width: 90px; height: 90px; background: white; border-radius: 18px; 
                    display: flex; align-items: center; justify-content: center; 
                    font-size: 2.2rem; font-weight: 800; color: #1a1a1a;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .store-title-wrap h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 0.2rem; letter-spacing: -0.02em; }
                .store-tagline { font-size: 1.1rem; opacity: 0.8; font-weight: 500; }
                
                .hero-actions { display: flex; gap: 1rem; }
                .btn-follow { background: #2563eb; color: white; padding: 0.8rem 1.8rem; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 0.6rem; border: none; transition: 0.3s; }
                .btn-follow.following { background: white; color: #2563eb; }
                .btn-contact-concierge { background: rgba(255,255,255,0.1); color: white; padding: 0.8rem 1.8rem; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 0.6rem; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); transition: 0.3s; }
                .btn-follow:hover { background: #1d4ed8; transform: translateY(-2px); }
                .btn-follow.following:hover { background: #f8fafc; }
                .btn-contact-concierge:hover { background: rgba(255,255,255,0.2); transform: translateY(-2px); }

                /* STATS BAR */
                .stats-bar-container { margin-top: -45px; position: relative; z-index: 20; }
                .stats-grid-refined { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
                .stat-item-luxury { padding: 1.5rem; display: flex; align-items: center; gap: 1.2rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.8); }
                .stat-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .stat-icon-wrap.blue { background: #eff6ff; color: #2563eb; }
                .stat-icon-wrap.green { background: #f0fdf4; color: #16a34a; }
                .stat-icon-wrap.gold { background: #fffbeb; color: #d97706; }
                .stat-icon-wrap.purple { background: #faf5ff; color: #9333ea; }
                .stat-texts label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; }
                .stat-texts p { font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-top: 0.1rem; }

                /* MAIN CONTENT */
                .luxury-main { padding-top: 5rem; }
                .luxury-section { margin-bottom: 6rem; }
                .section-header-luxury { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; }
                .section-header-luxury h2 { font-size: 2.2rem; font-weight: 800; color: #1a1a1a; margin-bottom: 0.5rem; }
                .sub-header { color: #64748b; font-size: 1.1rem; font-weight: 500; }
                
                .scroll-controls { display: flex; gap: 0.8rem; }
                .control-btn { width: 44px; height: 44px; border-radius: 50%; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; transition: 0.3s; color: #64748b; }
                .control-btn:hover { background: #f8fafc; color: #1a1a1a; border-color: #cbd5e1; }

                /* MULTIMEDIA SLIDER */
                .gallery-slider-section { position: relative; }
                .multimedia-slider-wrap { 
                    display: flex; 
                    gap: 1.5rem; 
                    overflow-x: auto; 
                    padding: 1rem 0 2rem;
                    scroll-snap-type: x mandatory;
                    scrollbar-width: none;
                }
                .multimedia-slider-wrap::-webkit-scrollbar { display: none; }
                
                .multimedia-card { 
                    flex: 0 0 400px; 
                    height: 500px; 
                    border-radius: 24px; 
                    position: relative; 
                    overflow: hidden; 
                    scroll-snap-align: start;
                    transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                .slider-media { 
                    width: 100%; 
                    height: 100%; 
                    object-fit: cover; 
                    transition: 0.6s;
                }
                .media-overlay { 
                    position: absolute; 
                    inset: 0; 
                    background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%); 
                    display: flex; 
                    align-items: flex-end; 
                    padding: 2rem;
                    opacity: 0;
                    transition: 0.3s;
                }
                .media-overlay label { color: white; font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; }
                
                .multimedia-card:hover { transform: scale(1.02); }
                .multimedia-card:hover .slider-media { transform: scale(1.05); }
                .multimedia-card:hover .media-overlay { opacity: 1; }

                /* PRODUCTS */
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 2rem;
                }

                /* LEGACY */
                .legacy-section-wrap { background: #f8fafc; border: none; padding: 0; overflow: hidden; margin-top: 4rem; margin-bottom: 6rem; }
                .legacy-content { display: grid; grid-template-columns: 1.2fr 1fr; }
                .legacy-text { padding: 5rem; }
                .legacy-text h2 { font-size: 2.8rem; font-weight: 800; margin-bottom: 2rem; }
                .legacy-text p { font-size: 1.2rem; color: #475569; line-height: 1.8; margin-bottom: 3.5rem; }
                .legacy-stats { display: flex; gap: 4rem; }
                .l-stat h3 { font-size: 2.5rem; font-weight: 800; color: #2563eb; margin-bottom: 0.5rem; }
                .l-stat label { font-size: 0.95rem; font-weight: 700; color: #64748b; }
                
                .legacy-visual { background: #eff6ff; position: relative; display: flex; align-items: center; justify-content: center; }
                .legacy-shape { width: 70%; height: 70%; background: white; border-radius: 50% 50% 50% 0; box-shadow: 20px 20px 60px rgba(0,0,0,0.05); }

                /* TESTIMONIALS */
                .testimonials-wrap { background: #2563eb; color: white; border-radius: 32px; padding: 5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66 3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-73c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm0 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM58 80c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm9-70c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM31 50c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm19-21c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm27 0c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm-27 48c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E"); }
                .testimonial-card-luxury { position: relative; }
                .quote-icon { margin-bottom: 1.5rem; opacity: 0.5; }
                .stars-row { display: flex; gap: 0.3rem; margin-bottom: 1.5rem; }
                .t-text { font-size: 1.6rem; font-weight: 500; line-height: 1.6; margin-bottom: 2.5rem; font-style: italic; }
                .t-author { display: flex; align-items: center; gap: 1rem; }
                .author-avatar { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-weight: 800; border: 2px solid white; }
                .author-info strong { display: block; font-size: 1.1rem; }
                .author-info label { font-size: 0.85rem; opacity: 0.7; }

                /* RESPONSIVE */
                @media (max-width: 1200px) {
                    .stats-grid-refined { grid-template-columns: repeat(2, 1fr); }
                    .legacy-content { grid-template-columns: 1fr; }
                    .legacy-visual { display: none; }
                    .testimonials-wrap { grid-template-columns: 1fr; }
                }

                @media (max-width: 768px) {
                    .store-header-main { flex-direction: column; align-items: flex-start; gap: 2rem; }
                    .store-title-wrap h1 { font-size: 2.5rem; }
                    .multimedia-card { flex: 0 0 280px; height: 350px; }
                    .stats-grid-refined { grid-template-columns: 1fr; }
                    .luxury-hero { height: 75vh; }
                    .legacy-text { padding: 2rem; }
                    .legacy-stats { flex-wrap: wrap; gap: 2rem; }
                    .testimonials-wrap { padding: 2rem; }
                    .t-text { font-size: 1.2rem; }
                }
            `}</style>
        </div>
    );
};

export default PublicStore;
