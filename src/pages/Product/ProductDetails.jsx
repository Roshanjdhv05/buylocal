import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard';
import {
    ShoppingCart, Heart, Star, Store, ArrowLeft,
    Share2, MapPin, ShieldCheck, RefreshCcw, Truck,
    ChevronRight, Info, MessageCircle, Clock, Camera
} from 'lucide-react';
import { useProduct } from '../../hooks/useProduct';
import ProductSkeleton from '../../components/ProductSkeleton';
import ProductNotFound from './ProductNotFound';
import { addToRecentlyViewed } from '../../utils/recentlyViewed';

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartCount } = useCart();
    const { user } = useAuth();

    // Use our custom hook for robust data fetching
    const { product, store, loading, error } = useProduct(productId);

    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);

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

    // Review & Related Products Fetching (after product is loaded)
    useEffect(() => {
        if (!product) return;

        const fetchExtras = async () => {
            try {
                // 1. Fetch Reviews
                setReviewsLoading(true);
                const { data: reviewsData } = await withTimeout(
                    supabase
                        .from('product_reviews')
                        .select(`*, users:user_id (username)`)
                        .eq('product_id', product.id)
                        .order('created_at', { ascending: false })
                );
                setReviews(reviewsData || []);

                // 2. Fetch Related Products
                if (product.category) {
                    const { data: relatedData } = await withTimeout(
                        supabase.from('products')
                            .select('*')
                            .eq('category', product.category)
                            .neq('id', product.id)
                            .limit(4)
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

    // Review States
    const [reviewForm, setReviewForm] = useState({ rating: 5, content: '', media: [] });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMediaPreviews, setReviewMediaPreviews] = useState([]);

    // UI Handle for loading and error states
    if (loading) return <ProductSkeleton />;
    if (!product && !loading) return <ProductNotFound />;

    const handleToggleWishlist = async () => {
        if (!user) return navigate('/login');
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
        if (!user) return navigate('/login');
        if (!reviewForm.content.trim()) return alert('Please write something');

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
        : '0.0';
    const discount = product && product.mrp ? Math.round(((product.mrp - (product.online_price || product.price)) / product.mrp) * 100) : 0;

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (error || !product) return (
        <div className="error-page-refined">
            <div className="container center-vh">
                <h2>Product Not Found</h2>
                <button onClick={() => navigate('/')} className="btn-primary-purple">Go Home</button>
            </div>
        </div>
    );

    return (
        <div className="pro-details-luxury">
            {/* STICKY APP HEADER */}
            <header className="app-header-sticky">
                <div className="header-inner container">
                    <button className="icon-btn-circle" onClick={() => navigate(-1)}>
                        <ArrowLeft size={22} color="#7c3aed" />
                    </button>
                    <h1 className="header-brand">BuyLocal</h1>
                    <div className="header-actions-right">
                        <Link to="/cart" className="cart-badge-btn">
                            <ShoppingCart size={22} color="#7c3aed" />
                            {cartCount > 0 && <span className="badge-dot">{cartCount}</span>}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="details-body container">
                <div className="product-main-layout">
                    {/* LEFT COLUMN: IMAGES */}
                    <div className="gallery-column">
                        <div className="hero-product-card">
                            <div className="image-viewport">
                                <img src={images[selectedImageIndex]} alt={product.name} />
                                <div className="hero-top-badges">
                                    <div className="badge-fast">FAST DELIVERY</div>
                                    <button
                                        className={`btn-wishlist-circle ${isLiked ? 'active' : ''}`}
                                        onClick={handleToggleWishlist}
                                    >
                                        <Heart size={20} fill={isLiked ? "#ef4444" : "none"} color={isLiked ? "#ef4444" : "#64748b"} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        {images.length > 1 && (
                            <div className="gallery-navigation-wrapper">
                                <div className="gallery-thumbnails">
                                    {images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className={`thumb-box ${idx === selectedImageIndex ? 'active' : ''}`}
                                            onClick={() => setSelectedImageIndex(idx)}
                                        >
                                            <img src={img} alt={`${product.name} thumbnail ${idx}`} />
                                        </div>
                                    ))}
                                </div>
                                <div className="mobile-dots desktop-hidden">
                                    {images.map((_, idx) => (
                                        <span
                                            key={idx}
                                            className={`p-dot ${idx === selectedImageIndex ? 'active' : ''}`}
                                            onClick={() => setSelectedImageIndex(idx)}
                                        ></span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: INFO & ACTIONS */}
                    <div className="info-column">
                        <section className="product-info-wrap">
                            <div className="info-header-row">
                                <h1 className="pro-name-large">{product.name}</h1>
                                <div className="rating-pill">
                                    <Star size={12} fill="#22c55e" color="#22c55e" />
                                    <span>{avgRating}</span>
                                </div>
                            </div>

                            <div className="vendor-link">
                                Sold by <Link to={`/store/${store?.id}`}>{store?.name || 'Local Seller'}</Link>
                            </div>

                            <div className="pricing-box glass-card">
                                <div className="pricing-info">
                                    <div className="price-main">₹{product.online_price || product.price}</div>
                                    {product.mrp && (
                                        <div className="mrp-row">
                                            <span className="mrp-old">₹{product.mrp}</span>
                                            <span className="discount-tag">{discount}% OFF</span>
                                        </div>
                                    )}
                                </div>
                                <p className="tax-label">inclusive of all taxes</p>

                                <div className="desktop-actions desktop-only">
                                    <button className="btn-solid-purple buy-now-btn" onClick={() => { addToCart(product); navigate('/cart'); }}>
                                        Buy Now
                                    </button>
                                    <button className="btn-outline-purple add-cart-btn" onClick={() => addToCart(product)}>
                                        <ShoppingCart size={20} /> Add to Cart
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="service-features-grid">
                            <div className="feature-col">
                                <Truck size={20} color="#7c3aed" />
                                <span className="feat-label">FAST</span>
                            </div>
                            <div className="feature-col-divider"></div>
                            <div className="feature-col">
                                <ShieldCheck size={20} color="#7c3aed" />
                                <span className="feat-label">WARRANTY</span>
                            </div>
                            <div className="feature-col-divider"></div>
                            <div className="feature-col">
                                <RefreshCcw size={20} color="#7c3aed" />
                                <span className="feat-label">7D RETURNS</span>
                            </div>
                        </section>

                        <section className="description-section">
                            <h3 className="sub-title">Product Description</h3>
                            <p className={`desc-text ${descExpanded ? 'expanded' : ''}`}>
                                {product.description || "No detailed description provided for this premium local product. Crafted with excellence and available only on BuyLocal."}
                            </p>
                            <button className="read-more-btn" onClick={() => setDescExpanded(!descExpanded)}>
                                {descExpanded ? 'Show less' : 'Read full description'}
                            </button>
                        </section>

                        <section className="store-profile-card">
                            <Link to={`/store/${store?.id}`} className="store-card-inner">
                                <div className="store-avatar-pill">
                                    <Store size={24} color="#7c3aed" />
                                </div>
                                <div className="store-details">
                                    <h3>{store?.name || 'Loading Store...'}</h3>
                                    <div className="store-meta-items">
                                        <div className="meta-item">
                                            <MapPin size={14} color="#94a3b8" />
                                            <span>0.4 km away</span>
                                        </div>
                                        <div className="meta-item">
                                            <Clock size={14} color="#94a3b8" />
                                            <span>30 min delivery</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={24} color="#cbd5e1" className="ms-auto" />
                            </Link>
                        </section>

                        {/* RATING & REVIEWS SYSTEM */}
                        <section className="unified-reviews-luxury">
                            <div className="reviews-summary-row">
                                <div className="summary-col">
                                    <h4>Customer Reviews</h4>
                                    <div className="avg-big-row">
                                        <span className="big-num">{avgRating}</span>
                                        <div className="stars-stat-col">
                                            <div className="stars-row-tiny">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star key={i} size={14} fill={i <= Math.round(avgRating) ? "#22c55e" : "none"} color="#22c55e" />
                                                ))}
                                            </div>
                                            <span className="count-label">{reviews.length} ratings</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="luxury-review-post-card">
                                <h5>Write a Review</h5>
                                <form onSubmit={handleReviewSubmit}>
                                    <div className="star-input-row">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                                                <Star size={24} fill={s <= reviewForm.rating ? "#7c3aed" : "none"} color="#7c3aed" />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        placeholder="Share your experience with this product..."
                                        value={reviewForm.content}
                                        onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                                    />
                                    <div className="media-upload-refined">
                                        <label className="media-drop-zone">
                                            <Camera size={20} />
                                            <span>Add Photos</span>
                                            <input type="file" multiple accept="image/*" hidden onChange={handleMediaChange} />
                                        </label>
                                        <div className="previews-strip">
                                            {reviewMediaPreviews.map((p, i) => (
                                                <img key={i} src={p} alt="Preview" />
                                            ))}
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-post-luxury" disabled={submittingReview}>
                                        {submittingReview ? 'Posting...' : 'Post Review'}
                                    </button>
                                </form>
                            </div>

                            <div className="luxury-reviews-list">
                                {reviews.length === 0 ? (
                                    <div className="empty-reviews">Be the first to review this product!</div>
                                ) : (
                                    reviews.map(review => (
                                        <div key={review.id} className="review-card-modern">
                                            <div className="rev-header">
                                                <div className="user-avatar-tiny">
                                                    {review.users?.username?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="rev-meta">
                                                    <div className="user-name">{review.users?.username || 'Verified Buyer'}</div>
                                                    <div className="stars-mini">
                                                        {[...Array(review.rating)].map((_, i) => <Star key={i} size={12} fill="#22c55e" color="#22c55e" />)}
                                                    </div>
                                                </div>
                                                <div className="rev-date">{new Date(review.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <p className="rev-content-text">{review.content}</p>
                                            {review.media_urls?.length > 0 && (
                                                <div className="rev-media-gallery">
                                                    {review.media_urls.map((url, i) => (
                                                        <img key={i} src={url} alt="Review" onClick={() => window.open(url)} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* RELATED PRODUCTS */}
                {relatedProducts.length > 0 && (
                    <section className="related-section">
                        <h3 className="section-title-alt">YOU MIGHT ALSO LIKE</h3>
                        <div className="related-grid-scroll">
                            {relatedProducts.map(p => (
                                <div key={p.id} className="related-card-wrap">
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* STICKY BOTTOM ACTIONS (MOBILE ONLY) */}
            <div className="sticky-action-bar mobile-only">
                <div className="container action-inner">
                    <button className="btn-outline-purple" onClick={() => addToCart(product)}>
                        ADD TO CART
                    </button>
                    <button className="btn-solid-purple" onClick={() => { addToCart(product); navigate('/cart'); }}>
                        BUY NOW
                    </button>
                </div>
            </div>

            <style>{`
                .pro-details-luxury { background: #fdfdfd; min-height: 100vh; padding-bottom: 110px; color: #1e293b; }
                .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
                
                .app-header-sticky { position: sticky; top: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); z-index: 1000; padding: 0.6rem 0; border-bottom: 1px solid #f1f5f9; }
                .header-inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
                .header-brand { font-size: 1.15rem; font-weight: 950; color: #7c3aed; letter-spacing: -0.5px; margin: 0; }
                .icon-btn-circle { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: none; border-radius: 50%; transition: 0.2s; flex-shrink: 0; }
                .icon-btn-circle:hover { background: #f1f5f9; }
                .cart-badge-btn { position: relative; padding: 0.4rem; display: flex; align-items: center; }
                .badge-dot { position: absolute; top: 0; right: 0; background: #ef4444; color: white; font-size: 0.65rem; font-weight: 800; min-width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; }

                /* MAIN LAYOUT GRID */
                .product-main-layout { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 0.5rem; }
                
                @media (min-width: 1024px) {
                    .container { padding: 0 1.5rem; }
                    .product-main-layout { grid-template-columns: 1fr 480px; gap: 5rem; align-items: start; margin-top: 1.5rem; }
                    .gallery-column { position: sticky; top: 120px; }
                    .pro-details-luxury { padding-bottom: 5rem; }
                    .sticky-action-bar.mobile-only { display: none; }
                    .image-viewport { height: 500px; aspect-ratio: unset; }
                    .header-brand { font-size: 1.5rem; }
                    .icon-btn-circle { width: 44px; height: 44px; }
                    .gallery-navigation-wrapper { margin-top: 1.5rem; }
                    .thumb-box { width: 64px; height: 64px; }
                }

                /* GALLERY SECTION */
                .hero-product-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 15px rgba(0,0,0,0.02); border: 1px solid #f1f5f9; }
                .image-viewport { position: relative; width: 100%; height: 280px; display: flex; align-items: center; justify-content: center; background: white; padding: 1rem; }
                .image-viewport img { max-width: 100%; max-height: 100%; object-fit: contain; }
                .hero-top-badges { position: absolute; top: 0.75rem; left: 0.75rem; right: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
                .badge-fast { background: #7c3aed; color: white; font-size: 0.6rem; font-weight: 950; padding: 0.3rem 0.6rem; border-radius: 6px; z-index: 10; }
                .btn-wishlist-circle { width: 32px; height: 32px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border: none; z-index: 10; }

                .gallery-navigation-wrapper { margin-top: 0.75rem; }
                .gallery-thumbnails { display: flex; gap: 0.65rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: none; }
                .gallery-thumbnails::-webkit-scrollbar { display: none; }
                .thumb-box { width: 52px; height: 52px; border-radius: 10px; border: 2px solid #f1f5f9; overflow: hidden; cursor: pointer; flex-shrink: 0; background: white; padding: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: 0.2s; }
                .thumb-box img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
                .thumb-box.active { border-color: #7c3aed; transform: scale(1.05); }

                .mobile-dots { display: flex; justify-content: center; gap: 0.4rem; margin-top: 0.75rem; }
                .p-dot { width: 6px; height: 6px; background: #e2e8f0; border-radius: 50%; cursor: pointer; }
                .p-dot.active { background: #7c3aed; width: 16px; border-radius: 8px; }

                /* INFO & ACTIONS COLUMN */
                .pro-name-large { font-size: 1.25rem; font-weight: 900; color: #0f172a; line-height: 1.3; margin-bottom: 0.4rem; }
                .rating-pill { background: #f0fdf4; color: #16a34a; padding: 0.2rem 0.5rem; border-radius: 4px; display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 800; border: 1px solid #dcfce7; width: fit-content; }
                .vendor-link { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }
                .vendor-link a { color: #7c3aed; font-weight: 700; text-decoration: none; }
                
                .pricing-box { background: white; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid #f1f5f9; }
                .pricing-info { display: flex; flex-direction: column; gap: 0.1rem; }
                .price-main { font-size: 1.75rem; font-weight: 950; color: #0f172a; }
                .mrp-row { display: flex; align-items: center; gap: 0.5rem; }
                .mrp-old { font-size: 0.95rem; color: #94a3b8; text-decoration: line-through; }
                .discount-tag { background: #fee2e2; color: #ef4444; font-size: 0.75rem; font-weight: 900; padding: 0.15rem 0.4rem; border-radius: 4px; }
                .tax-label { font-size: 0.75rem; color: #94a3b8; margin-top: 0.3rem; }

                .desktop-actions { display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; }
                .btn-solid-purple { width: 100%; background: #0f172a; color: white; border: none; padding: 1rem; border-radius: 12px; font-weight: 900; font-size: 1rem; }
                .btn-outline-purple { width: 100%; border: 2px solid #e2e8f0; background: white; color: #0f172a; padding: 1rem; border-radius: 12px; font-weight: 900; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

                /* SERVICE FEATURES */
                .service-features-grid { display: flex; background: #f8fafc; border-radius: 12px; padding: 1rem; margin-bottom: 2rem; justify-content: space-around; border: 1px solid #f1f5f9; }
                .feature-col { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; flex: 1; }
                .feat-label { font-size: 0.6rem; font-weight: 900; color: #64748b; text-align: center; }
                .feature-col-divider { width: 1px; height: 20px; background: #e2e8f0; align-self: center; }

                /* DESCRIPTION */
                .description-section { margin-bottom: 2rem; }
                .sub-title { font-size: 1rem; font-weight: 900; margin-bottom: 0.5rem; color: #0f172a; }
                .desc-text { font-size: 0.85rem; color: #475569; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .desc-text.expanded { -webkit-line-clamp: unset; }
                .read-more-btn { background: transparent; border: none; color: #7c3aed; font-weight: 800; font-size: 0.85rem; margin-top: 0.4rem; }

                /* STORE CARD */
                .store-profile-card { margin-bottom: 2.5rem; }
                .store-card-inner { background: white; border-radius: 16px; padding: 1rem; display: flex; align-items: center; gap: 0.75rem; border: 1px solid #f1f5f9; text-decoration: none; }
                .store-avatar-pill { width: 40px; height: 40px; background: #f5f3ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .store-details h3 { font-size: 0.95rem; font-weight: 900; color: #0f172a; margin-bottom: 0.1rem; }
                .store-meta-items { display: flex; gap: 0.75rem; flex-wrap: wrap; }
                .meta-item { display: flex; align-items: center; gap: 0.2rem; font-size: 0.75rem; color: #64748b; font-weight: 700; }
                .ms-auto { margin-left: auto; }

                /* REVIEWS SECTION & MEDIA FIX */
                .unified-reviews-luxury { margin-bottom: 2.5rem; }
                .avg-big-row { border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1.5rem; }
                .big-num { font-size: 2.5rem; font-weight: 950; color: #0f172a; line-height: 1; }
                
                .luxury-review-post-card { background: #f8fafc; border-radius: 16px; padding: 1.25rem; margin-bottom: 2rem; border: 1px solid #f1f5f9; }
                .star-input-row { display: flex; gap: 0.4rem; margin-bottom: 0.75rem; }
                .luxury-review-post-card textarea { width: 100%; border-radius: 10px; padding: 0.75rem; border: 1px solid #e2e8f0; min-height: 80px; margin-bottom: 0.75rem; font-size: 0.9rem; }
                .btn-post-luxury { width: 100%; background: #0f172a; color: white; border: none; border-radius: 10px; padding: 0.85rem; font-weight: 800; font-size: 0.9rem; }

                .review-card-modern { padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
                .rev-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem; }
                .user-avatar-tiny { width: 32px; height: 32px; font-size: 0.8rem; }
                .user-name { font-size: 0.9rem; font-weight: 800; color: #0f172a; }
                .rev-date { font-size: 0.75rem; color: #94a3b8; margin-left: auto; }
                .rev-content-text { font-size: 0.85rem; color: #475569; line-height: 1.4; }
                
                /* FIX: Constrain huge review images */
                .rev-media-gallery { display: flex; gap: 0.6rem; margin-top: 0.75rem; flex-wrap: wrap; }
                .rev-media-gallery img { width: 70px; height: 70px; border-radius: 8px; object-fit: cover; border: 1px solid #f1f5f9; }

                /* PREVIEWS FIX */
                .previews-strip { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
                .previews-strip img { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; border: 1px solid #e2e8f0; }

                /* RELATED SECTION */
                .related-section { margin-top: 2rem; border-top: 1px solid #f1f5f9; padding-top: 2rem; }
                .section-title-alt { font-size: 0.8rem; font-weight: 950; color: #94a3b8; letter-spacing: 1px; margin-bottom: 1rem; }
                .related-grid-scroll { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 1rem; scrollbar-width: none; }
                .related-card-wrap { flex: 0 0 140px; }
                /* Ensure related images aren't huge */
                .related-card-wrap img { max-height: 160px; object-fit: cover; }

                @media (min-width: 1024px) {
                    .pro-name-large { font-size: 2.25rem; }
                    .price-main { font-size: 2.75rem; }
                    .related-grid-scroll { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); overflow: visible; gap: 1.5rem; }
                    .related-card-wrap { flex: unset; }
                    .related-card-wrap img { max-height: unset; }
                    .rev-media-gallery img { width: 100px; height: 100px; }
                    .btn-solid-purple, .btn-outline-purple { padding: 1.25rem; border-radius: 16px; font-size: 1.1rem; }
                }

                /* MOBILE STICKY BAR - FIXED & SIDE-BY-SIDE */
                .sticky-action-bar { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); padding: 0.6rem 1rem calc(0.6rem + env(safe-area-inset-bottom)); box-shadow: 0 -8px 30px rgba(0,0,0,0.06); z-index: 1001; border-top: 1px solid #f1f5f9; }
                .action-inner { display: flex; gap: 0.6rem; width: 100%; max-width: 600px; margin: 0 auto; }
                .action-inner button { flex: 1; padding: 0.75rem; border-radius: 10px; font-size: 0.85rem; font-weight: 900; height: 44px; display: flex; align-items: center; justify-content: center; }
                
                .mobile-only { display: flex; }
                .desktop-only { display: none; }
                
                @media (min-width: 1024px) {
                    .mobile-only { display: none; }
                    .desktop-only { display: flex; }
                }

                @media (max-width: 640px) {
                    .hero-product-card { border-radius: 0; margin: 0 -1rem; border: none; border-bottom: 1px solid #f1f5f9; }
                    .pricing-box { margin: 0; margin-bottom: 1rem; }
                }

                .loader-container { height: 100vh; display: flex; align-items: center; justify-content: center; }
                .loader { width: 50px; height: 50px; border: 5px solid #f1f5f9; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ProductDetails;
