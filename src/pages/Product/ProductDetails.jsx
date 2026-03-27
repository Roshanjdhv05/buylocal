import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard';
import {
    ShoppingCart, Heart, Star, Store, ArrowLeft,
    Share2, MapPin, ShieldCheck, RefreshCcw, Truck,
    ChevronRight, Info, MessageCircle, Clock, Camera,
    ChevronDown, ShieldAlert, Award
} from 'lucide-react';
import { useProduct } from '../../hooks/useProduct';
import ProductNotFound from './ProductNotFound';
import { addToRecentlyViewed } from '../../utils/recentlyViewed';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/productTranslations';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './ProductDetails.css';

const ProductDetails = () => {
    const { t, i18n } = useTranslation();
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart, cartCount } = useCart();
    const { user } = useAuth();

    // Data fetching via custom hook
    const { product, store, loading, error } = useProduct(productId);

    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('description');

    const checkWishlistStatus = async () => {
        if (!user || !product) return;
        try {
            const { data } = await supabase
                .from('wishlist')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', product.id)
                .single();
            if (data) setIsLiked(true);
        } catch (error) { }
    };

    useEffect(() => {
        if (!product) return;

        const fetchExtras = async () => {
            try {
                setReviewsLoading(true);
                const { data: reviewsData } = await withTimeout(
                    supabase
                        .from('product_reviews')
                        .select(`*, users:user_id (username)`)
                        .eq('product_id', product.id)
                        .order('created_at', { ascending: false })
                );
                setReviews(reviewsData || []);

                if (product.category) {
                    const { data: relatedData } = await withTimeout(
                        supabase.from('products')
                            .select('*')
                            .eq('category', product.category)
                            .neq('id', product.id)
                            .limit(5)
                    );
                    setRelatedProducts(relatedData || []);
                }
            } catch (err) {
                console.error('Error fetching extras:', err);
            } finally {
                setReviewsLoading(false);
            }
        };

        fetchExtras();
        if (user) checkWishlistStatus();
        addToRecentlyViewed(product);
        window.scrollTo(0, 0);
    }, [product, user]);

    // Review Actions Logic
    const [reviewForm, setReviewForm] = useState({ rating: 5, content: '', media: [] });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMediaPreviews, setReviewMediaPreviews] = useState([]);

    if (loading) return <LoadingSpinner fullPage />;
    if (!product && !loading) return <ProductNotFound />;

    const handleToggleWishlist = async () => {
        if (!user) return navigate('/login', { state: { from: location } });
        if (wishlistLoading) return;
        setWishlistLoading(true);
        try {
            if (isLiked) {
                await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
                setIsLiked(false);
            } else {
                await supabase.from('wishlist').insert([{ user_id: user.id, product_id: productId }]);
                setIsLiked(true);
            }
        } catch (error) {
            console.error('Wishlist error:', error);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        setReviewForm(prev => ({ ...prev, media: [...prev.media, ...files] }));
        const previews = files.map(file => URL.createObjectURL(file));
        setReviewMediaPreviews(prev => [...prev, ...previews]);
    };

    const uploadReviewMedia = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
            .from('review-media')
            .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('review-media').getPublicUrl(filePath);
        return publicUrl;
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) return navigate('/login', { state: { from: location } });
        if (!reviewForm.content.trim()) return alert('Please write something first.');

        setSubmittingReview(true);
        try {
            const mediaUrls = [];
            for (const file of reviewForm.media) {
                const url = await uploadReviewMedia(file);
                mediaUrls.push(url);
            }

            const { data, error } = await supabase
                .from('product_reviews')
                .insert([{
                    product_id: productId,
                    user_id: user.id,
                    rating: reviewForm.rating,
                    content: reviewForm.content,
                    media_urls: mediaUrls
                }])
                .select(`*, users:user_id (username)`)
                .single();

            if (error) throw error;
            setReviews([data, ...reviews]);
            setReviewForm({ rating: 5, content: '', media: [] });
            setReviewMediaPreviews([]);
            alert('Review posted successfully!');
        } catch (err) {
            alert('Failed to post review: ' + err.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    const getImages = () => {
        if (!product) return [];
        if (Array.isArray(product.images) && product.images.length > 0) return product.images;
        if (Array.isArray(product.image_urls) && product.image_urls.length > 0) return product.image_urls;
        if (typeof product.image === 'string') return [product.image];
        return ['https://via.placeholder.com/600x600?text=No+Image'];
    };

    const images = getImages();
    const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '4.8'; // Defaulting as seen in image
    
    // Derived values
    const discount = product && product.mrp ? Math.round(((product.mrp - (product.online_price || product.price)) / product.mrp) * 100) : 0;
    const isOutOfStock = product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 0;

    return (
        <div className="pro-details-luxury">
            <div className="container">
                {/* BREADCRUMBS */}
                <nav className="breadcrumb-nav">
                    <Link to="/">{t('nav.home')}</Link>
                    <span className="breadcrumb-divider">/</span>
                    <Link to={`/category/${product.category}`}>{product.category}</Link>
                    <span className="breadcrumb-divider">/</span>
                    <span className="active">{product.name}</span>
                </nav>

                <main className="product-main-layout">
                    {/* COLUMN 1: VERTICAL THUMBNAILS */}
                    <div className="gallery-column">
                        <div className="gallery-thumbnails">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`thumb-box ${idx === selectedImageIndex ? 'active' : ''}`}
                                    onClick={() => setSelectedImageIndex(idx)}
                                >
                                    <img src={img} alt={`thumbnail ${idx}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COLUMN 2: HERO IMAGE */}
                    <div className="hero-column-wrapper">
                        <div className="hero-column">
                            <img src={images[selectedImageIndex]} alt={product.name} />
                            <div className="hero-badges">
                                <span className="badge-fast">Fast Delivery</span>
                            </div>
                            <button className="btn-wishlist-top" onClick={handleToggleWishlist}>
                                <Heart size={20} fill={isLiked ? "#ef4444" : "none"} color={isLiked ? "#ef4444" : "#1a1a1a"} />
                            </button>
                        </div>
                        {images.length > 1 && (
                            <div className="mobile-pagination-dots desktop-hidden">
                                {images.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`page-dot ${idx === selectedImageIndex ? 'active' : ''}`}
                                        onClick={() => setSelectedImageIndex(idx)}
                                    ></div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COLUMN 3: INFO & ACTION */}
                    <div className="info-column">
                        <div className="brand-header">
                            <span className="product-brand-info">{product.category} / PREMIUM</span>
                            <h1 className="product-title-luxury">{getLocalizedName(product.name, i18n.language)}</h1>
                        </div>

                        <div className="rating-row">
                            <div className="stars-group">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill={i < Math.round(Number(avgRating)) ? "#7c3aed" : "none"} color="#7c3aed" />
                                ))}
                            </div>
                            <span className="rating-text">{avgRating} ({reviews.length} reviews)</span>
                            <span className="breadcrumb-divider">|</span>
                            <Link to={`/${encodeURIComponent(store?.name)}`} className="sold-by-badge">Sold by {store?.name || 'Local Store'}</Link>
                        </div>

                        <div className="pricing-luxury">
                            <span className="price-now">₹{product.online_price || product.price}</span>
                            {product.mrp && <span className="price-mrp">₹{product.mrp}</span>}
                        </div>
                        <p className="tax-disclaimer">Inclusive of all taxes and duties</p>

                        <div className="stock-status-luxury">
                            <div className={`stock-indicator ${isOutOfStock ? 'red' : 'green'}`}></div>
                            <span>{isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK — READY TO SHIP'}</span>
                        </div>

                        <div className="action-buttons-luxury mobile-hidden">
                            <button 
                                className={`btn-buy-now ${isOutOfStock ? 'disabled' : ''}`}
                                disabled={isOutOfStock}
                                onClick={() => {
                                    if (!isOutOfStock) {
                                        addToCart(product);
                                        navigate('/cart');
                                    }
                                }}
                            >
                                Buy It Now
                            </button>
                            <button 
                                className={`btn-add-bag ${isOutOfStock ? 'disabled' : ''}`}
                                disabled={isOutOfStock}
                                onClick={() => {
                                    if (!isOutOfStock) {
                                        addToCart(product);
                                        alert('Added to Bag!');
                                    }
                                }}
                            >
                                Add to Bag
                            </button>
                        </div>

                        <div className="trust-features-list">
                            <div className="trust-item">
                                <div className="trust-icon"><Truck size={20} color="#7c3aed" /></div>
                                <div className="trust-content">
                                    <h4>Complimentary Express Shipping</h4>
                                    <p>Arrives in 2-3 business days.</p>
                                </div>
                            </div>
                            <div className="trust-item">
                                <div className="trust-icon"><RefreshCcw size={20} color="#7c3aed" /></div>
                                <div className="trust-content">
                                    <h4>30-Day Bespoke Returns</h4>
                                    <p>Hassle-free collection from your door.</p>
                                </div>
                            </div>
                            <div className="trust-item">
                                <div className="trust-icon"><Award size={20} color="#7c3aed" /></div>
                                <div className="trust-content">
                                    <h4>Extended 2-Year Warranty</h4>
                                    <p>Full coverage for manufacturing excellence.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* TABS SECTION */}
                <section className="details-tabs-container">
                    <div className="tabs-nav">
                        <button className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
                        <button className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`} onClick={() => setActiveTab('specifications')}>Specifications</button>
                        <button className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Customer Reviews</button>
                    </div>

                    <div className="tab-content-layout">
                        <div className="tab-main-content">
                            {activeTab === 'description' && (
                                <div className="description-hero">
                                    <h2>Engineering Meets Local Excellence</h2>
                                    <p>{getLocalizedName(product.description, i18n.language) || "This premium product is crafted with the highest standards, ensuring every detail reflects the commitment to quality of our local artisans."}</p>
                                    
                                    <div className="feature-cards-row">
                                        <div className="feature-card">
                                            <h5>THE CRAFT</h5>
                                            <p>Proprietary techniques used by local masters to provide superior quality and longevity.</p>
                                        </div>
                                        <div className="feature-card">
                                            <h5>THE DETAIL</h5>
                                            <p>Every element is inspected to ensure it meet the premium standards of BuyLocal.</p>
                                        </div>
                                    </div>

                                    <button className="view-more-details">
                                        Read more <ChevronDown size={14} />
                                    </button>
                                </div>
                            )}

                            {activeTab === 'specifications' && (
                                <div className="specs-list">
                                    <div className="stat-luxury-row">
                                        <span className="stat-lux-label">Material</span>
                                        <span className="stat-lux-value">Premium Hand-picked</span>
                                    </div>
                                    <div className="stat-luxury-row">
                                        <span className="stat-lux-label">Origin</span>
                                        <span className="stat-lux-value">{store?.city || 'Local'}</span>
                                    </div>
                                    <div className="stat-luxury-row">
                                        <span className="stat-lux-label">Warranty</span>
                                        <span className="stat-lux-value">2 Years Official</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="reviews-tab-content">
                                    <div className="review-form-simple">
                                        <h3>Write a Review</h3>
                                        <form onSubmit={handleReviewSubmit}>
                                            <div className="star-input-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <Star 
                                                        key={v} 
                                                        size={24} 
                                                        fill={v <= reviewForm.rating ? "#7c3aed" : "none"} 
                                                        color="#7c3aed" 
                                                        onClick={() => setReviewForm({ ...reviewForm, rating: v })}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                ))}
                                            </div>
                                            <textarea 
                                                className="settings-input-light" 
                                                placeholder="Share your experience..." 
                                                style={{ height: '100px', marginBottom: '1rem' }}
                                                value={reviewForm.content}
                                                onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                                            />
                                            <button type="submit" className="btn-buy-now" disabled={submittingReview}>
                                                {submittingReview ? 'Posting...' : 'Post Review'}
                                            </button>
                                        </form>
                                    </div>

                                    <div className="reviews-list-luxury" style={{ marginTop: '2rem' }}>
                                        {reviews.map(rev => (
                                            <div key={rev.id} className="review-card-modern" style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <strong>{rev.users?.username || 'Buyer'}</strong>
                                                    <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                                                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < rev.rating ? "#7c3aed" : "none"} color="#7c3aed" />)}
                                                </div>
                                                <p>{rev.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SIDE COLUMN: BRAND CARD */}
                        <div className="brand-side-column">
                            <div className="store-side-card">
                                <div className="store-header-luxury">
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div className="store-logo-wrap">{store?.name?.charAt(0) || 'S'}</div>
                                        <div className="store-name-luxury">
                                            <h3>{store?.name}</h3>
                                            <span className="verified-merchant">Verified Merchant</span>
                                        </div>
                                    </div>
                                    <Link to={`/${encodeURIComponent(store?.name)}`} className="btn-visit-brand desktop-hidden" style={{ textDecoration: 'none' }}>
                                        Visit Store
                                    </Link>
                                </div>

                                <div className="store-stats-luxury">
                                    <div className="stat-luxury-row">
                                        <span className="stat-lux-label">Rating</span>
                                        <span className="stat-lux-value">4.9 / 5.0</span>
                                    </div>
                                    <div className="stat-luxury-row">
                                        <span className="stat-lux-label">Followers</span>
                                        <span className="stat-lux-value">1.2K</span>
                                    </div>
                                    <div className="stat-luxury-row">
                                        <span className="stat-lux-label">Dispatch</span>
                                        <span className="stat-lux-value green">Within 12h</span>
                                    </div>
                                </div>

                                <Link to={`/${encodeURIComponent(store?.name)}`} className="btn-visit-brand mobile-hidden" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                                    Visit Brand Store
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SIMILAR PRODUCTS */}
                {relatedProducts.length > 0 && (
                    <section className="similar-masterpieces">
                        <span className="curated-label">Curated for you</span>
                        <div className="similar-header">
                            <h2>Similar Masterpieces</h2>
                            <Link to="/search" className="explore-all-link">Explore All</Link>
                        </div>
                        <div className="similar-grid">
                            {relatedProducts.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* MOBILE STICKY ACTION BAR */}
            <div className="sticky-action-bar mobile-only desktop-hidden">
                <div className="action-inner">
                    <button 
                        className={`btn-outline-purple ${isOutOfStock ? 'disabled' : ''}`}
                        disabled={isOutOfStock}
                        onClick={() => {
                            if (!isOutOfStock) {
                                addToCart(product);
                                alert('Added to Bag!');
                            }
                        }}
                    >
                        Add to Bag
                    </button>
                    <button 
                        className={`btn-solid-purple ${isOutOfStock ? 'disabled' : ''}`}
                        disabled={isOutOfStock}
                        onClick={() => {
                            if (!isOutOfStock) {
                                addToCart(product);
                                navigate('/cart');
                            }
                        }}
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
