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

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartCount } = useCart();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [store, setStore] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);

    // Review States
    const [reviews, setReviews] = useState([]);
    const [reviewForm, setReviewForm] = useState({ rating: 5, content: '', media: [] });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMediaPreviews, setReviewMediaPreviews] = useState([]);

    useEffect(() => {
        const fetchEverything = async () => {
            try {
                setLoading(true);
                // 1. Fetch Product
                const { data: productData, error: productError } = await withTimeout(
                    supabase.from('products').select('*').eq('id', productId).single()
                );
                if (productError) throw productError;
                setProduct(productData);

                // 2. Fetch Store
                if (productData.store_id) {
                    const { data: storeData } = await withTimeout(
                        supabase.from('stores').select('*').eq('id', productData.store_id).single()
                    );
                    setStore(storeData);
                }

                // 3. Fetch Reviews
                const { data: reviewsData } = await withTimeout(
                    supabase
                        .from('product_reviews')
                        .select(`*, users:user_id (username)`)
                        .eq('product_id', productId)
                        .order('created_at', { ascending: false })
                );
                setReviews(reviewsData || []);

                // 4. Fetch Related Products
                if (productData.category) {
                    const { data: relatedData } = await withTimeout(
                        supabase.from('products')
                            .select('*')
                            .eq('category', productData.category)
                            .neq('id', productId)
                            .limit(4)
                    );
                    setRelatedProducts(relatedData || []);
                }

            } catch (err) {
                console.error('Error fetching details:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchEverything();
            window.scrollTo(0, 0);
        }
        if (productId && user) checkWishlistStatus();
    }, [productId, user]);

    const checkWishlistStatus = async () => {
        try {
            const { data } = await supabase
                .from('wishlist')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .single();
            if (data) setIsLiked(true);
        } catch (error) { }
    };

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
                {/* IMAGE HERO CARD */}
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
                        {images.length > 1 && (
                            <div className="image-pagination-dots">
                                {images.map((_, idx) => (
                                    <span
                                        key={idx}
                                        className={`p-dot ${idx === selectedImageIndex ? 'active' : ''}`}
                                        onClick={() => setSelectedImageIndex(idx)}
                                    ></span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* PRODUCT INFO */}
                <section className="product-info-wrap">
                    <div className="info-header-row">
                        <h2 className="pro-name-large">{product.name}</h2>
                        <div className="rating-pill">
                            <Star size={12} fill="#22c55e" color="#22c55e" />
                            <span>{avgRating}</span>
                        </div>
                    </div>

                    <div className="vendor-link">
                        Sold by <Link to={`/store/${store?.id}`}>{store?.name || 'Local Seller'}</Link>
                    </div>

                    <div className="pricing-info">
                        <div className="price-main">₹{product.online_price || product.price}</div>
                        {product.mrp && <div className="mrp-old">₹{product.mrp}</div>}
                    </div>
                    <div className="tax-label">incl. all taxes</div>
                </section>

                {/* CORE FEATURES GRID */}
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

                {/* DESCRIPTION */}
                <section className="description-section">
                    <p className={`desc-text ${descExpanded ? 'expanded' : ''}`}>
                        {product.description || "No detailed description provided for this premium local product. Crafted with excellence and available only on BuyLocal."}
                    </p>
                    <button className="read-more-btn" onClick={() => setDescExpanded(!descExpanded)}>
                        {descExpanded ? 'Show less' : 'Read more'}
                    </button>
                </section>

                {/* STORE CARD REFINED */}
                <section className="store-profile-card">
                    <div className="store-card-inner">
                        <div className="store-avatar-pill">
                            <Store size={24} color="#7c3aed" />
                        </div>
                        <div className="store-details">
                            <h3>{store?.name || 'Loading Store...'}</h3>
                            <div className="store-meta-items">
                                <div className="meta-item">
                                    <MapPin size={14} color="#94a3b8" />
                                    <span>0.4 km</span>
                                </div>
                                <div className="meta-item">
                                    <Clock size={14} color="#94a3b8" />
                                    <span>30-45 min</span>
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={24} color="#cbd5e1" className="ms-auto" />
                    </div>
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

                    {/* Review Form */}
                    <div className="luxury-review-post-card">
                        <h5>Leave a Review</h5>
                        <form onSubmit={handleReviewSubmit}>
                            <div className="star-input-row">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                                        <Star size={24} fill={s <= reviewForm.rating ? "#7c3aed" : "none"} color="#7c3aed" />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                placeholder="Tell us what you liked or didn't..."
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

                    {/* Reviews List */}
                    <div className="luxury-reviews-list">
                        {reviews.length === 0 ? (
                            <div className="empty-reviews">No reviews yet. Be the first to rate!</div>
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

                {/* RELATED PRODUCTS */}
                {relatedProducts.length > 0 && (
                    <section className="related-section">
                        <h3 className="section-title-alt">RELATED PRODUCTS</h3>
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

            {/* STICKY BOTTOM ACTIONS */}
            <div className="sticky-action-bar">
                <div className="container action-inner">
                    <button className="btn-outline-purple" onClick={() => addToCart(product)}>
                        ADD
                    </button>
                    <button className="btn-solid-purple" onClick={() => { addToCart(product); navigate('/cart'); }}>
                        BUY NOW
                    </button>
                </div>
            </div>

            <style>{`
                .pro-details-luxury { background: #f8fafc; min-height: 100vh; padding-bottom: 80px; }
                .container { max-width: 600px; margin: 0 auto; padding: 0 1.25rem; }
                
                /* APP HEADER */
                .app-header-sticky { position: sticky; top: 0; background: white; z-index: 100; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
                .header-inner { display: flex; align-items: center; justify-content: space-between; }
                .header-brand { font-size: 1.4rem; font-weight: 800; color: #7c3aed; }
                .icon-btn-circle { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; }
                .cart-badge-btn { position: relative; padding: 0.5rem; }
                .badge-dot { position: absolute; top: 0px; right: 0px; background: #ef4444; color: white; font-size: 0.7rem; font-weight: 800; min-width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; }

                /* IMAGE VIEWPORT */
                .hero-product-card { background: white; border-radius: 20px; overflow: hidden; margin-top: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
                .image-viewport { position: relative; width: 100%; aspect-ratio: 1; padding: 1.5rem; display: flex; align-items: center; justify-content: center; background: #fcfcfc; }
                .image-viewport img { width: 90%; height: 90%; object-fit: contain; }
                .hero-top-badges { position: absolute; top: 1rem; left: 1rem; right: 1rem; display: flex; justify-content: space-between; align-items: flex-start; }
                .badge-fast { background: #7c3aed; color: white; font-size: 0.7rem; font-weight: 900; padding: 0.4rem 0.8rem; border-radius: 8px; letter-spacing: 0.5px; }
                .btn-wishlist-circle { width: 36px; height: 36px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: none; }
                .p-dot { width: 8px; height: 8px; background: #e2e8f0; border-radius: 50%; transition: 0.3s; cursor: pointer; }
                .p-dot.active { background: #7c3aed; width: 24px; border-radius: 10px; }
                .image-pagination-dots { position: absolute; bottom: 1.25rem; left: 0; right: 0; display: flex; justify-content: center; gap: 0.5rem; }

                /* PRODUCT INFO */
                .product-info-wrap { margin-top: 1.5rem; }
                .info-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
                .pro-name-large { font-size: 1.6rem; font-weight: 900; color: #1e293b; letter-spacing: -0.01em; }
                .rating-pill { background: #f0fdf4; color: #22c55e; padding: 0.2rem 0.6rem; border-radius: 6px; display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; font-weight: 700; }
                .vendor-link { font-size: 0.95rem; color: #64748b; margin-bottom: 1.25rem; }
                .vendor-link a { color: #7c3aed; font-weight: 700; text-decoration: none; border-bottom: 1px solid rgba(124, 58, 237, 0.2); transition: 0.2s; }
                .pricing-info { display: flex; align-items: center; gap: 0.75rem; }
                .price-main { font-size: 1.8rem; font-weight: 900; color: #1e293b; }
                .mrp-old { font-size: 1.1rem; color: #94a3b8; text-decoration: line-through; }
                .tax-label { font-size: 0.85rem; color: #94a3b8; font-style: italic; margin-top: 0.1rem; }

                /* CORE FEATURES */
                .service-features-grid { display: flex; background: #f5f3ff; border: 1px solid rgba(124, 58, 237, 0.1); border-radius: 16px; padding: 1.25rem; margin-top: 2rem; justify-content: space-around; align-items: center; }
                .feature-col { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
                .feat-label { font-size: 0.7rem; font-weight: 900; color: #4338ca; letter-spacing: 0.5px; }
                .feature-col-divider { width: 1px; height: 24px; background: rgba(124, 58, 237, 0.1); }

                /* DESCRIPTION */
                .description-section { margin-top: 2rem; }
                .desc-text { font-size: 0.95rem; color: #475569; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .desc-text.expanded { -webkit-line-clamp: unset; }
                .read-more-btn { background: transparent; border: none; color: #7c3aed; font-weight: 700; font-size: 0.9rem; padding: 0; margin-top: 0.5rem; }

                /* STORE CARD */
                .store-profile-card { margin-top: 2rem; }
                .store-card-inner { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; border: 1px solid #f1f5f9; }
                .store-avatar-pill { width: 48px; height: 48px; background: #f5f3ff; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .store-details h3 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 0.2rem; }
                .store-meta-items { display: flex; gap: 1rem; }
                .meta-item { display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; color: #64748b; font-weight: 600; }
                .ms-auto { margin-left: auto; }

                /* REVIEWS & RATINGS */
                .unified-reviews-luxury { margin-top: 3rem; background: white; border-radius: 20px; padding: 1.5rem; border: 1px solid #f1f5f9; }
                .reviews-summary-row { margin-bottom: 2rem; }
                .summary-col h4 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 1rem; }
                .avg-big-row { display: flex; align-items: center; gap: 1.25rem; }
                .big-num { font-size: 3rem; font-weight: 900; color: #1e293b; line-height: 1; }
                .stars-stat-col { display: flex; flex-direction: column; gap: 0.25rem; }
                .stars-row-tiny { display: flex; gap: 2px; }
                .count-label { font-size: 0.85rem; color: #64748b; font-weight: 600; }

                .luxury-review-post-card { background: #f8fafc; border-radius: 16px; padding: 1.25rem; margin-bottom: 2.5rem; }
                .luxury-review-post-card h5 { font-weight: 800; margin-bottom: 1rem; }
                .star-input-row { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
                .star-input-row button { background: transparent; border: none; padding: 0; }
                .luxury-review-post-card textarea { width: 100%; height: 100px; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 1rem; font-family: inherit; resize: none; font-size: 0.95rem; }
                .media-upload-refined { margin-bottom: 1.5rem; }
                .media-drop-zone { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; background: white; border: 1px dashed #cbd5e1; border-radius: 10px; cursor: pointer; color: #64748b; font-weight: 600; font-size: 0.85rem; }
                .previews-strip { display: flex; gap: 0.5rem; margin-top: 0.75rem; overflow-x: auto; }
                .previews-strip img { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
                .btn-post-luxury { width: 100%; background: #7c3aed; color: white; border: none; padding: 0.85rem; border-radius: 12px; font-weight: 800; }

                .luxury-reviews-list { display: flex; flex-direction: column; gap: 1.5rem; }
                .review-card-modern { padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; }
                .review-card-modern:last-child { border-bottom: none; }
                .rev-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
                .user-avatar-tiny { width: 36px; height: 36px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #475569; font-size: 0.85rem; }
                .rev-meta { flex: 1; }
                .user-name { font-weight: 700; font-size: 0.9rem; color: #1e293b; }
                .stars-mini { display: flex; gap: 1px; }
                .rev-date { font-size: 0.75rem; color: #94a3b8; }
                .rev-content-text { font-size: 0.9rem; color: #475569; line-height: 1.5; margin-bottom: 0.75rem; }
                .rev-media-gallery { display: flex; gap: 0.5rem; overflow-x: auto; }
                .rev-media-gallery img { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; cursor: pointer; }
                .empty-reviews { text-align: center; padding: 2rem; color: #94a3b8; font-weight: 600; }

                /* RELATED SECTION */
                .related-section { margin-top: 3rem; }
                .section-title-alt { font-size: 0.85rem; font-weight: 800; color: #94a3b8; letter-spacing: 1px; margin-bottom: 1.5rem; }
                .related-grid-scroll { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; scrollbar-width: none; }
                .related-grid-scroll::-webkit-scrollbar { display: none; }
                .related-card-wrap { flex: 0 0 240px; }

                /* BOTTOM ACTIONS */
                .sticky-action-bar { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 1rem 0 calc(1rem + env(safe-area-inset-bottom)); box-shadow: 0 -10px 30px rgba(0,0,0,0.05); z-index: 200; border-top: 1px solid #f1f5f9; }
                .action-inner { display: flex; gap: 1rem; }
                .btn-outline-purple { flex: 1; border: 2px solid #7c3aed; background: white; color: #7c3aed; padding: 0.85rem; border-radius: 12px; font-weight: 800; font-size: 1rem; transition: 0.2s; }
                .btn-solid-purple { flex: 1.2; background: #7c3aed; color: white; border: none; padding: 0.85rem; border-radius: 12px; font-weight: 800; font-size: 1rem; box-shadow: 0 8px 16px rgba(124, 58, 237, 0.25); transition: 0.2s; }
                .btn-solid-purple:active, .btn-outline-purple:active { transform: scale(0.97); }

                @media (min-width: 600px) {
                    .pro-details-luxury { padding-top: 2rem; }
                    .app-header-sticky { border-radius: 20px 20px 0 0; margin-top: 1rem; }
                    .sticky-action-bar { max-width: 600px; left: 50%; transform: translateX(-50%); border-radius: 20px 20px 0 0; }
                }

                .loader-container { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
                .loader { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top: 4px solid #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ProductDetails;
