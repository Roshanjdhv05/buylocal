import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    ShoppingCart, MapPin, Phone, Clock, ArrowLeft, Store,
    UserCheck, MessageSquare, Package, Star, CreditCard, ChevronRight, ChevronLeft,
    Award, ShieldCheck, Globe, Instagram, Twitter, Facebook, X, Truck, Box
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import SEO from '../../components/SEO';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { getLocalizedName } from '../../utils/productTranslations';
import { PLACEHOLDERS } from '../../utils/imageUtils';

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
    const [followersCount, setFollowersCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
    const [customCategories, setCustomCategories] = useState([]);
    const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(null);

    const allMedia = React.useMemo(() => {
        const gallery = Array.isArray(store?.gallery_urls) ? store.gallery_urls : [];
        const videos = Array.isArray(store?.video_urls) ? store.video_urls : [];
        return [...videos, ...gallery];
    }, [store?.gallery_urls, store?.video_urls]);

    const nextSlide = () => {
        setSelectedGalleryIndex(prev => (prev + 1) % allMedia.length);
    };

    const prevSlide = () => {
        setSelectedGalleryIndex(prev => (prev - 1 + allMedia.length) % allMedia.length);
    };

    useEffect(() => {
        fetchStoreProfile();
    }, [storeName]);

    useEffect(() => {
        if (store?.id) {
            fetchReviews();
            fetchCustomCategories();
            fetchFollowersCount();
            if (user) {
                checkIfFollowing();
            }
        }
    }, [store?.id, user]);

    const fetchFollowersCount = async () => {
        if (!store?.id) return;
        const { count, error } = await supabase
            .from('store_follows')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id);
        if (!error && count !== null) {
            setFollowersCount(count);
        }
    };

    const formatFollowers = (num) => {
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num;
    };

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
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                const { error } = await supabase
                    .from('store_follows')
                    .insert([{ store_id: store.id, user_id: user.id }]);

                if (error) throw error;
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
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
                .eq('name', storeName) // useParams already decodes
                .single(), 30000, 'Public Store FetchProfile');

            if (storeError) throw storeError;
            setStore(storeData);

            if (storeData) {
                const { data: productsData } = await withTimeout(supabase
                    .from('products')
                    .select('*')
                    .eq('store_id', storeData.id)
                    .order('created_at', { ascending: false }), 30000, 'Public Store FetchProducts');

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

            if (error) {
                // Handle duplicate review (unique constraint)
                if (error.code === '23505') {
                    throw new Error('You have already reviewed this store. Only one review per store is allowed.');
                }
                throw error;
            }

            setIsReviewModalOpen(false);
            setComment('');
            setRating(5);
            fetchReviews();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0'; // Removed '5.0' fake default

    if (loading) return <LoadingSpinner fullPage />;
    if (!store) return <div className="error-container">{t('publicStore.notFound')}</div>;

    const storeSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": store.name,
        "image": store.banner_url || store.profile_picture_url || 'https://buylocal.in/logo.png',
        "description": store.description || store.legacy_description || `Shop premium products from ${store.name} on BuyLocal.`,
        "url": typeof window !== 'undefined' ? window.location.href : '',
        "telephone": store.phone || '',
        "address": {
            "@type": "PostalAddress",
            "streetAddress": store.address || '',
            "addressLocality": store.city || '',
            "addressRegion": store.state || '',
            "addressCountry": "IN"
        }
    };
    if (store.lat && store.lng) {
        storeSchema.geo = {
            "@type": "GeoCoordinates",
            "latitude": store.lat,
            "longitude": store.lng
        };
    }
    if (averageRating > 0 && reviews.length > 0) {
        storeSchema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": averageRating,
            "reviewCount": reviews.length
        };
    }

    const renderStatsItems = () => (
        <>
            <div className="stat-item-minimal">
                <Package size={14} />
                <span>{products.length} {t('publicStore.stats.products', 'Products')}</span>
            </div>
            {store.free_delivery && (
                <div className="stat-item-minimal">
                    <Truck size={14} />
                    <span>{t('publicStore.stats.freeDelivery', 'Free Delivery')}</span>
                </div>
            )}
            {store.cod_available !== false && (
                <div className="stat-item-minimal">
                    <CreditCard size={14} />
                    <span>{t('publicStore.stats.codAvailable', 'COD Available')}</span>
                </div>
            )}
            {store.custom_highlights && Array.isArray(store.custom_highlights) && store.custom_highlights.length > 0 &&
                store.custom_highlights.map((h, idx) => (
                    <div key={`custom-h-${idx}`} className="stat-item-minimal" style={{ border: '1px solid #bc8a5f33' }}>
                        <Award size={14} style={{ color: '#bc8a5f' }} />
                        <span>{h}</span>
                    </div>
                ))
            }
        </>
    );

    return (
        <div className="luxury-store-wrapper">
            <SEO 
                title={`${store.name} - Shop collection | BuyLocal`}
                description={store.description || `Browse the latest collection from ${store.name}. Shop directly from local stores.`}
                canonicalUrl={typeof window !== 'undefined' ? window.location.href : ''}
                ogImage={store.banner_url || store.profile_picture_url}
                schema={storeSchema}
            />
            <Navbar />

            {/* LUXURY HERO SECTION */}
            <div className="luxury-hero">
                <div className="hero-banner-wrap">
                    <img 
                        src={store.banner_url || PLACEHOLDERS.BANNER} 
                        alt={store.name} 
                        className="hero-banner-img" 
                        onError={(e) => e.target.src = PLACEHOLDERS.BANNER}
                    />

                    <div className="hero-overlay"></div>
                </div>

                <div className="hero-content container">
                    <div className="luxury-header-left">
                        <div className="luxury-logo-side">
                                <img 
                                    src={store.profile_picture_url || PLACEHOLDERS.STORE_LOGO} 
                                    alt={store.name} 
                                    onError={(e) => e.target.src = PLACEHOLDERS.STORE_LOGO}
                                />
                        </div>
                        
                        <div className="luxury-info-side">
                            <div className="luxury-origin">{store.origin || ''}</div>
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
                            if (store.instagram) {
                                const url = store.instagram.startsWith('http') 
                                    ? store.instagram 
                                    : `https://instagram.com/${store.instagram.replace('@', '')}`;
                                window.open(url, '_blank');
                            }
                        }}>
                             Instagram
                        </button>
                        <button className="btn-action-pill btn-whatsapp" onClick={() => {
                            if (store.phone) window.open(`https://wa.me/${store.phone}`, '_blank');
                        }}>
                             WhatsApp
                        </button>
                        <button className={`btn-action-pill btn-follow ${isFollowing ? 'following' : ''}`} onClick={toggleFollow} disabled={followLoading}>
                            <span>{isFollowing ? t('publicStore.following', 'Following') : t('publicStore.follow', 'Follow')}</span>
                            <span className="follower-count-badge" style={{ marginLeft: '6px', paddingLeft: '6px', borderLeft: '1px solid currentColor', fontSize: '0.85em', opacity: 0.9 }}>
                                {formatFollowers(followersCount)}
                            </span>
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
                            <CategoryBox key={cat.id || idx} cat={cat} storeName={store.name} navigate={navigate} />
                        ))}

                    </div>
                </div>
            )}

            {/* STATS BAR - Pill Style Below Categories */}
            <div className="stats-bar-luxury">
                <div className="stats-row-luxury">
                    <div className="stats-marquee-track">
                        <div className="stats-marquee-content">
                            {renderStatsItems()}
                        </div>
                        <div className="stats-marquee-content mobile-clone" aria-hidden="true">
                            {renderStatsItems()}
                        </div>
                    </div>
                    {process.env.NODE_ENV === 'development' && console.log('Store Highlights Data:', store.custom_highlights)}
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

                        <div className="products-slider-wrap">
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
                {allMedia.length > 0 && (
                    <section className="luxury-section gallery-slider-section">
                        <div className="section-header-luxury">
                            <h2>{t('publicStore.boutiqueExperience', 'The Boutique Experience')}</h2>
                            <button className="control-btn view-all-btn" onClick={() => {
                                const container = document.getElementById('gallery-slider');
                                container.scrollBy({ left: 340, behavior: 'smooth' });
                            }}>
                                {t('publicStore.gallery', 'GALLERY')}
                            </button>
                        </div>

                        <div className="multimedia-slider-wrap" id="gallery-slider">
                            {allMedia.map((url, idx) => {
                                const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video') || url.includes('videos/');
                                return (
                                    <div key={idx} className="multimedia-card" onClick={() => setSelectedGalleryIndex(idx)} style={{ cursor: 'pointer' }}>
                                        {isVideo ? (
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <video src={url} muted loop playsInline className="slider-media" onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                                                <div className="video-badge" style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>VIDEO</div>
                                            </div>
                                        ) : (
                                            <img src={url} alt={`Gallery ${idx}`} className="slider-media" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* OUR STORY SECTION - Render only if exists */}
                {store.legacy_description && (
                <section className="legacy-section-wrap">
                    <div className="legacy-content">
                        <h2>{t('publicStore.ourStory', 'Our Story')}</h2>
                        <p>{store.legacy_description}</p>

                        <div className="legacy-stats" style={{ display: 'none' }}>
                            {/* Stats hidden until dynamic tracking is implemented */}
                            <div className="stat-item">
                                <div className="stat-icon-wrap"><Award size={20} /></div>
                                <div className="stat-text">
                                    <strong>{t('publicStore.heritage', 'HERITAGE')}</strong>
                                    <p>Authentic local tradition.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                )}

                {/* TESTIMONIALS - "The Collective Voice" */}
                <section className="luxury-section" id="reviews-section">
                    <div className="testimonials-wrap">
                        <div className="testimonials-header-row">
                            <h2>{t('publicStore.collectiveVoice', 'The Collective Voice')}</h2>
                            <button
                                className="btn-write-review"
                                onClick={() => {
                                    if (!user) return navigate('/login', { state: { from: location } });
                                    setIsReviewModalOpen(true);
                                }}
                            >
                                <MessageSquare size={15} />
                                {user ? 'Write a Review' : 'Login to Review'}
                            </button>
                        </div>

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
                                <div className="testimonial-card-luxury no-reviews-card">
                                    <MessageSquare size={32} style={{ color: '#bc8a5f', opacity: 0.4, marginBottom: '0.5rem' }} />
                                    <p className="t-text">"{t('publicStore.firstReview')}"</p>
                                    <button
                                        className="btn-write-review-inline"
                                        onClick={() => {
                                            if (!user) return navigate('/login', { state: { from: location } });
                                            setIsReviewModalOpen(true);
                                        }}
                                    >
                                        Be the first to review
                                    </button>
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

            {/* GALLERY LIGHTBOX */}
            {selectedGalleryIndex !== null && (
                <div className="lightbox-overlay" onClick={() => setSelectedGalleryIndex(null)}>
                    <button className="lightbox-close" onClick={() => setSelectedGalleryIndex(null)}>
                        <X size={32} />
                    </button>
                    
                    <button className="lightbox-arrow prev" onClick={(e) => { e.stopPropagation(); prevSlide(); }}>
                        <ChevronLeft size={40} />
                    </button>

                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        {(() => {
                            const url = allMedia[selectedGalleryIndex];
                            if (!url) return null;
                            const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video') || url.includes('videos/');
                            return isVideo ? (
                                <video src={url} controls autoPlay className="lightbox-media" />
                            ) : (
                                <img src={url} alt="Gallery view" className="lightbox-media" />
                            );
                        })()}
                    </div>

                    <button className="lightbox-arrow next" onClick={(e) => { e.stopPropagation(); nextSlide(); }}>
                        <ChevronRight size={40} />
                    </button>
                </div>
            )}

            <style>{`
                .luxury-store-wrapper { 
                    background: #fdfcfb; 
                    min-height: 100vh; 
                    padding-bottom: 8rem; 
                    color: #2c241e; 
                    overflow-x: hidden;
                }


                /* PHASE 3: LEFT-ALIGNED SWIPEABLE */
                .luxury-hero { 
                    position: relative; 
                    width: calc(100% - 2rem);
                    margin: 1rem auto 2rem auto;
                    border-radius: 24px;
                    height: 380px; 
                    background: #fdfaf7; 
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
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
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 100%); 
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
                
                @media (min-width: 1024px) {
                    .category-boxes-wrap {
                        max-width: 1200px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    .category-boxes-scroll {
                        padding: 0;
                        gap: 1.5rem;
                    }
                    .category-box-card { flex: 0 0 160px; }
                    .category-box-img-wrap { 
                        width: 160px; 
                        height: 216px; 
                        border-radius: 16px;
                    }
                    .category-box-name {
                        font-size: 0.8rem;
                        bottom: 1rem;
                    }
                }

                /* STATS BAR - Pill Style */
                .stats-bar-luxury { margin-bottom: 2rem; overflow: hidden; }
                .stats-row-luxury { 
                    display: flex; 
                    width: 100%;
                    padding: 0 1rem;
                }
                
                .stats-marquee-track {
                    display: flex;
                    gap: 0.6rem;
                    width: max-content;
                }

                .stats-marquee-content {
                    display: flex;
                    gap: 0.6rem;
                }

                .stats-marquee-content.mobile-clone {
                    display: none;
                }

                @media (max-width: 768px) {
                    .stats-row-luxury {
                        padding: 0;
                    }
                    .stats-marquee-content.mobile-clone {
                        display: flex;
                    }
                    .stats-marquee-track {
                        animation: scrollStats 15s linear infinite;
                    }
                }

                @keyframes scrollStats {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-50% - 0.3rem)); }
                }

                .stat-item-minimal { 
                    display: flex; 
                    align-items: center; 
                    gap: 0.5rem; 
                    color: #000000; 
                    font-size: 0.8rem; 
                    font-weight: 700; 
                    background: #ffffff;
                    padding: 0.75rem 1.25rem;
                    border-radius: 12px;
                    white-space: nowrap;
                    border: 1px solid #f0f0f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .stat-item-minimal:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.1);
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

                /* GALLERY & SLIDERS */
                .multimedia-slider-wrap, .products-slider-wrap {
                    display: flex;
                    gap: 1rem;
                    overflow-x: auto;
                    padding: 0 1rem 1.5rem;
                    scrollbar-width: none;
                    -webkit-overflow-scrolling: touch;
                }
                .multimedia-slider-wrap::-webkit-scrollbar, 
                .products-slider-wrap::-webkit-scrollbar { display: none; }

                .multimedia-card {
                    flex: 0 0 320px;
                    height: 480px;
                    border-radius: 4px;
                    overflow: hidden;
                    position: relative;
                }
                .slider-media { width: 100%; height: 100%; object-fit: cover; }

                /* General Collection Slider specific */
                .products-slider-wrap .luxury-product-card {
                    flex: 0 0 180px;
                    margin: 0;
                }
                
                @media (min-width: 1024px) {
                    .products-slider-wrap {
                        padding: 0;
                        gap: 2rem;
                    }
                    .products-slider-wrap .luxury-product-card {
                        flex: 0 0 280px;
                    }
                }

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

                /* TESTIMONIALS - Write Review button */
                .testimonials-header-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 1rem;
                    margin-bottom: 1.5rem;
                }
                .testimonials-header-row h2 {
                    font-size: 1.6rem;
                    margin: 0;
                }
                .btn-write-review {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.55rem 1.1rem;
                    border-radius: 20px;
                    background: #bc8a5f;
                    color: white;
                    font-size: 0.78rem;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .btn-write-review:hover { background: #a3744d; transform: translateY(-1px); }

                .no-reviews-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    min-width: 260px;
                }
                .btn-write-review-inline {
                    margin-top: 0.75rem;
                    padding: 0.5rem 1.25rem;
                    border-radius: 20px;
                    background: #fef8f4;
                    color: #bc8a5f;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: 1px solid #bc8a5f33;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-write-review-inline:hover { background: #bc8a5f; color: white; }

                /* MODAL */
                .review-modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
                }
                .review-modal-content {
                    width: 100%; max-width: 450px; padding: 2.5rem; position: relative; background: #fff; border-radius: 24px;
                }
                .modal-close { position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; color: #64748b; }

                /* LIGHTBOX */
                .lightbox-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                }
                .lightbox-content {
                    max-width: 90vw;
                    max-height: 85vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .lightbox-media {
                    max-width: 100%;
                    max-height: 85vh;
                    object-fit: contain;
                    border-radius: 4px;
                    box-shadow: 0 0 30px rgba(0,0,0,0.5);
                }
                .lightbox-close {
                    position: absolute;
                    top: 2rem;
                    right: 2rem;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    z-index: 10001;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .lightbox-close:hover { opacity: 1; }
                .lightbox-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10001;
                    transition: all 0.2s;
                }
                .lightbox-arrow:hover { background: rgba(255,255,255,0.2); }
                .lightbox-arrow.prev { left: 2rem; }
                .lightbox-arrow.next { right: 2rem; }

                @media (max-width: 768px) {
                    .lightbox-arrow {
                        width: 44px;
                        height: 44px;
                        background: rgba(0,0,0,0.3);
                    }
                    .lightbox-arrow.prev { left: 1rem; }
                    .lightbox-arrow.next { right: 1rem; }
                    .lightbox-close { top: 1rem; right: 1rem; }
                }
            `}</style>
        </div>
    );
};

const CategoryBox = ({ cat, storeName, navigate }) => {
    const [imgError, setImgError] = useState(false);
    
    return (
        <div 
            className="category-box-card"
            onClick={() => navigate(`/${encodeURIComponent(storeName)}/category/${encodeURIComponent(cat.name)}`)}
            style={{ cursor: 'pointer' }}
        >
            <div className="category-box-img-wrap">
                <img 
                    src={imgError ? PLACEHOLDERS.CATEGORY : cat.image_url} 
                    alt={cat.name} 
                    onError={() => setImgError(true)}
                />
                <div className="category-box-overlay"></div>
                <span className="category-box-name">{cat.name.toUpperCase()}</span>
            </div>
        </div>
    );
};

export default PublicStore;
