import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    ShoppingCart, MapPin, Phone, Clock, ArrowLeft, Store,
    UserCheck, MessageSquare, Package, Star, CreditCard, ChevronRight,
    Award, ShieldCheck, Globe, Instagram, Twitter, Facebook, X, Truck, Box
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { getLocalizedName } from '../../utils/productTranslations';

const PublicStore = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth(); // Get user for follow logic
    const { storeName } = useParams();
    const navigate = useNavigate();

    const location = useLocation();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
    const [customCategories, setCustomCategories] = useState([]);

    useEffect(() => {
        fetchStoreProfile();
    }, [storeName]);

    useEffect(() => {
        if (store?.id) {
            fetchReviews();
            fetchCustomCategories();
            if (user) {
                checkIfFollowing();
            }
        }
    }, [store?.id, user]);

    const fetchCustomCategories = async () => {
        if (!store?.id) return;
        try {
            const { data, error } = await supabase
                .from('store_custom_categories')
                .select('*')
                .eq('store_id', store.id)
                .order('display_order', { ascending: true });
            
            if (data) setCustomCategories(data);
        } catch (err) {
            console.error('Error fetching custom categories:', err.message);
        }
    };


    useEffect(() => {
        if (reviews.length > 1) {
            const interval = setInterval(() => {
                setCurrentTestimonialIndex(prev => (prev + 1) % reviews.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [reviews]);

    const checkIfFollowing = async () => {
        if (!store?.id || !user) return;
        const { data } = await supabase
            .from('store_follows')
            .select('*')
            .eq('store_id', store.id)
            .eq('user_id', user.id)
            .single();


        setIsFollowing(!!data);
    };

    const toggleFollow = async () => {
        if (!user) return navigate('/login', { state: { from: location } });
        if (!store?.id) return;
        setFollowLoading(true);
        try {
            if (isFollowing) {
                const { error } = await supabase
                    .from('store_follows')
                    .delete()
                    .eq('store_id', store.id)
                    .eq('user_id', user.id);
                if (error) throw error;
                setIsFollowing(false);
            } else {
                const { error } = await supabase
                    .from('store_follows')
                    .insert([{ store_id: store.id, user_id: user.id }]);

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
            setLoading(true);
            const { data: storeData, error: storeError } = await withTimeout(supabase
                .from('stores')
                .select('*')
                .eq('name', decodeURIComponent(storeName))
                .single(), 30000, 'Public Store FetchProfile');

            if (storeError) throw storeError;
            setStore(storeData);

            if (storeData) {
                const { data: productsData } = await withTimeout(supabase
                    .from('products')
                    .select('*')
                    .eq('store_id', storeData.id), 30000, 'Public Store FetchProducts');

                setProducts(productsData || []);
            }

        } catch (error) {
            console.error('Error fetching store profile:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        if (!store?.id) return;
        try {
            const { data, error } = await supabase
                .from('store_reviews')
                .select('*')
                .eq('store_id', store.id)

                .order('rating', { ascending: false })
                .limit(10);

            if (data) setReviews(data);
        } catch (err) {
            console.error('Error fetching reviews:', err.message);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!user) return navigate('/login', { state: { from: location } });

        setSubmittingReview(true);
        try {
            const { error } = await supabase
                .from('store_reviews')
                .insert([{
                    store_id: store.id,
                    user_id: user.id,

                    rating,
                    comment,
                    user_name: user.user_metadata?.full_name || user.email.split('@')[0],
                    user_avatar: user.user_metadata?.avatar_url
                }]);

            if (error) throw error;

            setIsReviewModalOpen(false);
            setComment('');
            setRating(5);
            fetchReviews();
            alert('Review submitted successfully!');
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '5.0';

    if (loading) return <LoadingSpinner fullPage />;
    if (!store) return <div className="error-container">{t('publicStore.notFound')}</div>;

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
                    <div className="luxury-header-left">
                        <div className="luxury-logo-side">
                            {store.profile_picture_url ? (
                                <img src={store.profile_picture_url} alt={store.name} />
                            ) : (
                                <Store size={40} />
                            )}
                        </div>
                        
                        <div className="luxury-info-side">
                            <div className="luxury-origin">{store.origin || t('publicStore.curatedRituals', 'CURATED RITUALS')}</div>
                            <h1 className="luxury-title-small">{store.name}</h1>
                            <div className="luxury-rating-small">
                                <Star size={14} fill="#8c5a3c" color="#8c5a3c" />
                                <span className="rating-val">{averageRating}</span>
                                <span className="reviews-count">({reviews.length || 0})</span>
                            </div>
                        </div>
                    </div>

                    <div className="luxury-action-scroll">
                        <button className="btn-action-pill btn-instagram" onClick={() => {
                            if (store.instagram_url) window.open(store.instagram_url, '_blank');
                        }}>
                             Instagram
                        </button>
                        <button className="btn-action-pill btn-whatsapp" onClick={() => {
                            if (store.phone) window.open(`https://wa.me/${store.phone}`, '_blank');
                        }}>
                             WhatsApp
                        </button>
                        <button className={`btn-action-pill btn-follow ${isFollowing ? 'following' : ''}`} onClick={toggleFollow} disabled={followLoading}>
                            {isFollowing ? t('publicStore.following', 'Following') : t('publicStore.follow', 'Follow')}
                        </button>
                        <button className="btn-action-pill btn-outline" onClick={() => {
                            if (store.location_url) window.open(store.location_url, '_blank');
                        }}>
                            <MapPin size={16} /> {t('publicStore.location', 'Location')}
                        </button>
                        <button className="btn-action-pill btn-outline" onClick={() => {
                            document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}>
                            {t('publicStore.reviews', 'Reviews')}
                        </button>
                    </div>
                </div>
            </div>

            {/* CUSTOM CATEGORY BOXES */}
            {customCategories.length > 0 && (
                <div className="category-boxes-wrap">
                    <div className="category-boxes-scroll">
                        {customCategories.map((cat, idx) => (
                            <div 
                                key={cat.id || idx} 
                                className="category-box-card"
                                onClick={() => navigate(`/${store.name}/category/${encodeURIComponent(cat.name)}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="category-box-img-wrap">
                                    <img src={cat.image_url} alt={cat.name} />
                                    <div className="category-box-overlay"></div>
                                    <span className="category-box-name">{cat.name.toUpperCase()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STATS BAR - Pill Style Below Categories */}
            <div className="stats-bar-luxury">
                <div className="stats-row-luxury">
                    <div className="stat-item-minimal">
                        <Package size={14} />
                        <span>{products.length || 500}+ {t('publicStore.stats.products', 'Products')}</span>
                    </div>
                    <div className="stat-item-minimal">
                        <Truck size={14} />
                        <span>{t('publicStore.stats.freeDelivery', 'Free Delivery')}</span>
                    </div>
                    <div className="stat-item-minimal">
                        <CreditCard size={14} />
                        <span>{t('publicStore.stats.codAvailable', 'COD Available')}</span>
                    </div>
                </div>
            </div>

            <main className="luxury-main">

                {/* DYNAMIC SECTIONS / PRODUCTS */}
                {Object.entries(products.reduce((acc, product) => {
                    const sectionName = product.section?.trim() || t('publicStore.generalCollection', 'General Collection');
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
                            <h2>{sectionName}</h2>
                            <button className="control-btn view-all-btn" onClick={() => navigate(`/${encodeURIComponent(store.name)}/section/${encodeURIComponent(sectionName)}`)}>
                                {t('publicStore.viewAll', 'View All')}
                            </button>
                        </div>

                        <div className="products-grid">
                            {sectionProducts.map(product => (
                                <ProductCard key={product.id} product={{ ...product, storeName: store.name }} />
                            ))}
                        </div>
                    </section>
                ))}

                {products.length === 0 && (
                    <section className="luxury-section">
                        <div className="no-products glass-card">
                            <Box size={40} />
                            <p>{t('publicStore.noProducts')}</p>
                        </div>
                    </section>
                )}

                {/* MULTIMEDIA GALLERY SLIDER - "The Boutique Experience" */}
                {store?.gallery_urls?.length > 0 && (
                    <section className="luxury-section gallery-slider-section">
                        <div className="section-header-luxury">
                            <h2>{t('publicStore.boutiqueExperience', 'The Boutique Experience')}</h2>
                            <button className="control-btn view-all-btn" onClick={() => {
                                const container = document.getElementById('gallery-slider');
                                container.scrollBy({ left: 400, behavior: 'smooth' });
                            }}>
                                {t('publicStore.gallery', 'GALLERY')}
                            </button>
                        </div>

                        <div className="multimedia-slider-wrap" id="gallery-slider">
                            {store.gallery_urls.map((url, idx) => {
                                const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video');
                                return (
                                    <div key={idx} className="multimedia-card">
                                        {isVideo ? (
                                            <video src={url} autoPlay muted loop playsInline className="slider-media" />
                                        ) : (
                                            <img src={url} alt={`Gallery ${idx}`} className="slider-media" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* OUR STORY SECTION */}
                <section className="legacy-section-wrap">
                    <div className="legacy-content">
                        <h2>{t('publicStore.ourStory', 'Our Story')}</h2>
                        <p>{store.legacy_description || `Founded in 1992, ${store.name} began as a small apothecary in the heart of Kyoto. Today, we are a global destination for curated beauty that respects the balance of nature and luxury...`}</p>

                        <div className="legacy-stats">
                            <div className="stat-item">
                                <div className="stat-icon-wrap"><Award size={20} /></div>
                                <div className="stat-text">
                                    <strong>{t('publicStore.heritage', 'HERITAGE')}</strong>
                                    <p>30 years of botanicals research and timeless tradition.</p>
                                </div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-icon-wrap"><Globe size={20} /></div>
                                <div className="stat-text">
                                    <strong>{t('publicStore.globalBoutiques', 'GLOBAL BOUTIQUES')}</strong>
                                    <p>Present in 34 cities, from Tokyo to Paris.</p>
                                </div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-icon-wrap"><Package size={20} /></div>
                                <div className="stat-text">
                                    <strong>{t('publicStore.handPicked', 'HAND-PICKED')}</strong>
                                    <p>Each formula is personally vetted for purity and efficacy.</p>
                                </div>
                            </div>
                        </div>
                        
                        <a href="#" className="read-more-story">{t('publicStore.readMore', 'READ MORE')} →</a>
                    </div>
                </section>

                {/* TESTIMONIALS - "The Collective Voice" */}
                <section className="luxury-section">
                    <div className="testimonials-wrap">
                        <h2>{t('publicStore.collectiveVoice', 'The Collective Voice')}</h2>

                        <div className="testimonial-carousel">
                            {reviews.length > 0 ? reviews.map((rev, idx) => (
                                <div key={idx} className="testimonial-card-luxury">
                                    <div className="stars-row">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                fill={i < rev.rating ? "#bc8a5f" : "none"}
                                                color={i < rev.rating ? "#bc8a5f" : "#ccc"}
                                            />
                                        ))}
                                    </div>
                                    <p className="t-text">"{rev.comment}"</p>
                                    <div className="t-author">
                                        <div className="author-avatar">
                                            {rev.user_avatar ? (
                                                <img src={rev.user_avatar} alt="User" />
                                            ) : (
                                                rev.user_name?.charAt(0) || 'U'
                                            )}
                                        </div>
                                        <div className="author-info">
                                            <strong>{rev.user_name}</strong>
                                            <label>{t('publicStore.verifiedPurchase')}</label>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="testimonial-card-luxury">
                                    <p className="t-text">"{t('publicStore.firstReview')}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* REVIEW MODAL */}
            {isReviewModalOpen && (
                <div className="review-modal-overlay" onClick={() => setIsReviewModalOpen(false)}>
                    <div className="review-modal-content glass-card" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setIsReviewModalOpen(false)}>
                            <X size={24} />
                        </button>
                        <h2>{t('publicStore.shareExperience')}</h2>
                        <p>{t('publicStore.feedbackHelp')}</p>

                        <form onSubmit={submitReview}>
                            <div className="rating-input">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`star-btn ${rating >= star ? 'active' : ''}`}
                                        onClick={() => setRating(star)}
                                    >
                                        <Star size={32} fill={rating >= star ? "#facc15" : "none"} color={rating >= star ? "#facc15" : "#e2e8f0"} />
                                    </button>
                                ))}
                            </div>

                             <textarea
                                 placeholder={t('publicStore.commentPlaceholder')}
                                 value={comment}
                                 onChange={(e) => setComment(e.target.value)}
                                 required
                             />
 
                             <button type="submit" className="btn-follow" style={{ width: '100%', marginTop: '1rem' }} disabled={submittingReview}>
                                 {submittingReview ? t('home.processing') : t('publicStore.submitReview')}
                             </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

                .luxury-store-wrapper { 
                    background: #fdfcfb; 
                    min-height: 100vh; 
                    padding-bottom: 8rem; 
                    color: #2c241e; 
                    font-family: 'Inter', sans-serif; 
                    overflow-x: hidden;
                }
                
                h1, h2, h3, h4, .luxury-origin { font-family: 'Playfair Display', serif; }

                /* PHASE 3: LEFT-ALIGNED SWIPEABLE */
                .luxury-hero { 
                    position: relative; 
                    width: 100%;
                    height: 380px; 
                    background: #fdfaf7; 
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    overflow: hidden;
                }
                .hero-banner-wrap { position: absolute; inset: 0; z-index: 1; }
                .hero-banner-img { 
                    width: 100%; 
                    height: 100%; 
                    object-fit: cover; 
                }
                .hero-overlay { 
                    position: absolute; 
                    inset: 0; 
                    background: linear-gradient(to top, rgba(140, 90, 60, 0.4) 0%, rgba(140, 90, 60, 0.1) 100%); 
                    z-index: 2; 
                }
                
                .hero-content { 
                    position: relative; 
                    z-index: 10; 
                    width: 100%;
                    padding: 0 1.5rem 1.5rem;
                }
                
                .luxury-header-left {
                    display: flex;
                    align-items: flex-end;
                    gap: 1rem;
                    color: white;
                    margin-bottom: 1.5rem;
                }
                .luxury-logo-side {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid white;
                    padding: 2px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    flex-shrink: 0;
                }
                .luxury-logo-side img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
                
                .luxury-info-side {
                    flex: 1;
                }
                .luxury-origin { 
                    font-size: 0.65rem; 
                    letter-spacing: 0.2em; 
                    color: rgba(255,255,255,0.9); 
                    margin-bottom: 0.25rem;
                    text-transform: uppercase;
                    font-weight: 500;
                }
                .luxury-title-small { 
                    font-size: 1.8rem; 
                    margin: 0; 
                    color: #fff; 
                    font-weight: 700;
                    font-family: 'Playfair Display', serif;
                    line-height:1.1;
                }
                .luxury-rating-small { 
                    display: flex; 
                    align-items: center; 
                    gap: 0.4rem; 
                    color: rgba(255,255,255,0.8); 
                    font-size: 0.8rem; 
                    margin-top: 0.25rem;
                }
                .luxury-rating-small .rating-val { font-weight: 700; color: #fff; }
                
                .luxury-action-scroll { 
                    display: flex; 
                    gap: 0.75rem; 
                    overflow-x: auto; 
                    flex-wrap: nowrap;
                    padding-bottom: 0.5rem;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .luxury-action-scroll::-webkit-scrollbar { display: none; }
                
                .btn-action-pill {
                    flex-shrink: 0;
                    height: 42px;
                    padding: 0 1.25rem;
                    border-radius: 21px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }
                .btn-instagram { background: linear-gradient(45deg, #f09433, #dc2743, #bc1888); color: white; }
                .btn-whatsapp { background: #25D366; color: white; }
                .btn-follow { background: #8c5a3c; color: white; }
                .btn-follow.following { background: rgba(255,255,255,0.2); border: 1px solid white; color: white; }
                .btn-outline { background: rgba(255,255,255,0.15); color: white; backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.3); }
                .btn-outline svg { color: white; }

                /* Reset category spacing */
                .category-boxes-wrap { 
                    margin-top: 2rem; 
                    margin-bottom: 2rem; 
                }
                .category-boxes-scroll { 
                    display: flex; 
                    gap: 0.75rem; 
                    overflow-x: auto; 
                    padding: 0 1rem 1rem;
                    scrollbar-width: none;
                    -webkit-overflow-scrolling: touch;
                }
                .category-boxes-scroll::-webkit-scrollbar { display: none; }
                
                .category-box-card { flex: 0 0 100px; }
                .category-box-img-wrap { 
                    width: 100px; 
                    height: 135px; 
                    border-radius: 12px; 
                    overflow: hidden; 
                    position: relative; 
                    background: #eee;
                }
                .category-box-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
                .category-box-overlay { 
                    position: absolute; inset: 0; 
                    background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5) 100%); 
                }
                .category-box-name { 
                    position: absolute; 
                    bottom: 0.5rem; 
                    left: 0; right: 0; 
                    text-align: center; 
                    color: white; 
                    font-weight: 600; 
                    font-size: 0.6rem; 
                    letter-spacing: 0.1em; 
                }

                /* STATS BAR - Pill Style */
                .stats-bar-luxury { margin-bottom: 2rem; }
                .stats-row-luxury { 
                    display: flex; 
                    gap: 0.6rem; 
                    overflow-x: auto; 
                    padding: 0 1rem;
                    scrollbar-width: none;
                }
                .stats-row-luxury::-webkit-scrollbar { display: none; }
                .stat-item-minimal { 
                    display: flex; 
                    align-items: center; 
                    gap: 0.4rem; 
                    color: #8b8b8b; 
                    font-size: 0.7rem; 
                    font-weight: 600; 
                    background: #f8f8f8;
                    padding: 0.6rem 0.9rem;
                    border-radius: 8px;
                    white-space: nowrap;
                }
                .stat-item-minimal svg { color: #bc8a5f; }

                /* SECTION HEADERS */
                .luxury-section { margin-bottom: 3rem; }
                .section-header-luxury { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: baseline; 
                    margin-bottom: 1.25rem; 
                    padding: 0 1rem;
                }
                .section-header-luxury h2 { font-size: 1.4rem; color: #2c241e; margin: 0; font-weight: 600; }
                .control-btn.view-all-btn { color: #bc8a5f; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; border: none; background: none; }

                /* PRODUCTS GRID */
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    padding: 0 1rem;
                }
                @media (min-width: 1024px) {
                    .products-grid {
                        grid-template-columns: repeat(4, 1fr);
                        gap: 2rem;
                        padding: 0;
                    }
                    .luxury-section, .section-header-luxury, .stats-bar-luxury, .testimonials-wrap h2 {
                        max-width: 1200px;
                        margin-left: auto;
                        margin-right: auto;
                        padding-left: 0;
                        padding-right: 0;
                    }
                }

                /* GALLERY */
                .multimedia-slider-wrap {
                    display: flex;
                    gap: 1rem;
                    overflow-x: auto;
                    padding: 0 1rem 1.5rem;
                    scrollbar-width: none;
                }
                .multimedia-slider-wrap::-webkit-scrollbar { display: none; }
                .multimedia-card {
                    flex: 0 0 280px;
                    height: 180px;
                    border-radius: 16px;
                    overflow: hidden;
                    position: relative;
                }
                .slider-media { width: 100%; height: 100%; object-fit: cover; }

                /* STORY SECTION */
                .legacy-section-wrap { background: #fff; border-radius: 24px; padding: 2rem 1.5rem; margin: 2rem 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
                .legacy-content h2 { font-size: 1.6rem; color: #2c241e; margin-bottom: 1rem; }
                .legacy-text p { font-size: 0.85rem; color: #8b8b8b; line-height: 1.6; margin-bottom: 1.5rem; }
                .legacy-stats { display: flex; flex-direction: column; gap: 1rem; }
                .stat-item { display: flex; align-items: start; gap: 1rem; }
                .stat-item .stat-icon-wrap { width: 40px; height: 40px; background: #fef8f4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #bc8a5f; flex-shrink: 0; }
                .stat-text strong { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #2c241e; }
                .stat-text p { font-size: 0.75rem; color: #8b8b8b; margin: 0; line-height: 1.4; }
                .read-more-story { color: #bc8a5f; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-top: 1.5rem; display: block; text-decoration: none; }
                @media (min-width: 1024px) {
                    .legacy-section-wrap { 
                        max-width: 1200px; 
                        margin: 4rem auto; 
                        padding: 4rem;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 4rem;
                    }
                    .legacy-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-top: 2rem; }
                }

                /* TESTIMONIALS */
                .testimonials-wrap h2 { font-size: 1.6rem; padding: 0 1rem; margin-bottom: 1.5rem; }
                .testimonial-carousel { display: flex; gap: 1rem; overflow-x: auto; padding: 0 1rem 2rem; scrollbar-width: none; }
                .testimonial-card-luxury { 
                    flex: 0 0 280px;
                    background: #fff; 
                    padding: 1.5rem; 
                    border-radius: 16px; 
                    box-shadow: 0 5px 15px rgba(0,0,0,0.02);
                }
                .stars-row { display: flex; gap: 0.2rem; margin-bottom: 0.75rem; }
                .t-text { font-size: 0.9rem; font-style: italic; color: #2c241e; margin-bottom: 1rem; font-family: 'Playfair Display', serif; }
                .t-author { display: flex; align-items: center; gap: 0.75rem; }
                .author-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: #eee; }
                .author-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .author-info strong { display: block; font-size: 0.8rem; color: #2c241e; }
                .author-info label { font-size: 0.65rem; color: #8b8b8b; }

                @media (max-width: 768px) {
                    .desktop-only { display: none; }
                }

                /* MODAL */
                .review-modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
                }
                .review-modal-content {
                    width: 100%; max-width: 450px; padding: 2.5rem; position: relative; background: #fff; border-radius: 24px;
                }
                .modal-close { position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; color: #64748b; }
            `}</style>
        </div>
    );
};

export default PublicStore;
