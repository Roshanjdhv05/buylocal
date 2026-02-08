import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ShoppingCart, Heart, Star, Store, ArrowLeft, Share2, MapPin } from 'lucide-react';

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const { user, profile } = useAuth();
    const [product, setProduct] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [reviewForm, setReviewForm] = useState({ rating: 5, content: '', media: [] });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMediaPreviews, setReviewMediaPreviews] = useState([]);
    const [isLiked, setIsLiked] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

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

            } catch (err) {
                console.error('Error fetching details:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (productId) fetchEverything();
        if (productId && user) checkWishlistStatus();
    }, [productId, user]);

    const checkWishlistStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('wishlist')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .single();

            if (data) setIsLiked(true);
            if (error && error.code !== 'PGRST116') throw error;
        } catch (error) {
            console.error('Error checking wishlist:', error.message);
        }
    };

    const handleToggleWishlist = async () => {
        if (!user) return navigate('/login');
        if (wishlistLoading) return;

        setWishlistLoading(true);
        try {
            if (isLiked) {
                const { error } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
                if (error) throw error;
                setIsLiked(false);
            } else {
                const { error } = await supabase
                    .from('wishlist')
                    .insert([{ user_id: user.id, product_id: productId }]);
                if (error) throw error;
                setIsLiked(true);
            }
        } catch (error) {
            console.error('Wishlist action failed:', error.message);
            alert('Failed to update wishlist');
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
    const discount = product && product.mrp ? Math.round(((product.mrp - (product.online_price || product.price)) / product.mrp) * 100) : 0;

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (error || !product) return (
        <div className="error-page">
            <Navbar />
            <div className="container error-content">
                <h2>oops! Product Not Found</h2>
                <p>{error || "The product you are looking for doesn't exist."}</p>
                <Link to="/" className="btn-primary">Back to Home</Link>
            </div>
            <Footer />
        </div>
    );

    return (
        <div className="product-details-page">
            <Navbar />

            <div className="container main-content">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={20} /> Back
                </button>

                <div className="product-grid">
                    <div className="gallery-section">
                        <div className="main-image-container">
                            <img src={images[selectedImageIndex]} alt={product.name} className="main-image" />
                            {discount > 0 && <span className="discount-tag">-{discount}% OFF</span>}
                        </div>
                        {images.length > 1 && (
                            <div className="thumbnails-scroll">
                                {images.map((img, idx) => (
                                    <div key={idx} className={`thumbnail ${idx === selectedImageIndex ? 'active' : ''}`} onClick={() => setSelectedImageIndex(idx)}>
                                        <img src={img} alt={`View ${idx + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="info-section">
                        <div className="product-header">
                            <h1 className="product-title">{product.name}</h1>
                            <div className="share-actions">
                                <button className="icon-btn"><Share2 size={20} /></button>
                                <button
                                    className={`wishlist-btn-main ${isLiked ? 'liked' : ''}`}
                                    onClick={handleToggleWishlist}
                                    disabled={wishlistLoading}
                                >
                                    <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>

                        {store && (
                            <Link to={`/store/${store.id}`} className="store-link">
                                <Store size={18} />
                                <span>Sold by <strong>{store.name}</strong></span>
                            </Link>
                        )}

                        <div className="price-block">
                            <div className="current-price">₹{product.online_price || product.price}</div>
                            {product.mrp && (
                                <div className="mrp-block">
                                    <span className="mrp-label">MRP</span>
                                    <span className="mrp-value">₹{product.mrp}</span>
                                </div>
                            )}
                        </div>
                        <p className="tax-note">Inclusive of all taxes</p>

                        <div className="action-buttons">
                            <button className="btn-add-cart-lg" onClick={() => addToCart(product)}>
                                <ShoppingCart size={20} /> Add to Cart
                            </button>
                            <button className="btn-buy-now">Buy Now</button>
                        </div>

                        <div className="description-block">
                            <h3>Description</h3>
                            <p>{product.description || "No description available."}</p>
                        </div>

                        <div className="features-grid">
                            <div className="feature-item"><span>🚚</span><span>Fast Delivery</span></div>
                            <div className="feature-item"><span>🛡️</span><span>Local Warranty</span></div>
                            <div className="feature-item"><span>↩️</span><span>Easy Returns</span></div>
                        </div>
                    </div>
                </div>

                {/* REVIEWS SECTION */}
                <section className="reviews-section-luxury">
                    <div className="reviews-header">
                        <h2>Client Reviews</h2>
                        <div className="rating-summary">
                            <div className="big-rating">{reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}</div>
                            <div className="stars-box">
                                <Star fill="#fcd34d" color="#fcd34d" size={20} />
                                <span>{reviews.length} Verified Reviews</span>
                            </div>
                        </div>
                    </div>

                    <div className="reviews-grid-main">
                        {/* New Review Form */}
                        <div className="review-form-card glass-card">
                            <h3>Write a Review</h3>
                            <form onSubmit={handleReviewSubmit}>
                                <div className="stars-input">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                                            <Star fill={s <= reviewForm.rating ? "#fcd34d" : "none"} color="#fcd34d" size={24} />
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    placeholder="Share your experience with this product..."
                                    required
                                    value={reviewForm.content}
                                    onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                                />
                                <div className="media-upload-row">
                                    <label className="media-btn">
                                        <Share2 size={18} /> Add Photos/Video
                                        <input type="file" multiple accept="image/*,video/*" hidden onChange={handleMediaChange} />
                                    </label>
                                    <div className="previews-row">
                                        {reviewMediaPreviews.map((p, i) => (
                                            <img key={i} src={p} alt="Preview" className="mini-preview" />
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" disabled={submittingReview}>
                                    {submittingReview ? 'Posting...' : 'Post Review'}
                                </button>
                            </form>
                        </div>

                        {/* Reviews List */}
                        <div className="reviews-list">
                            {reviews.length === 0 ? (
                                <p className="no-reviews">No reviews yet. Be the first to review!</p>
                            ) : (
                                reviews.map(review => (
                                    <div key={review.id} className="review-item glass-card">
                                        <div className="review-meta">
                                            <div className="reviewer">
                                                <div className="rev-avatar">{review.users?.username?.charAt(0).toUpperCase() || 'U'}</div>
                                                <div>
                                                    <div className="rev-name">{review.users?.username || 'Verified Buyer'}</div>
                                                    <div className="rev-date">{new Date(review.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="rev-stars">
                                                {[...Array(review.rating)].map((_, i) => <Star key={i} fill="#fcd34d" color="#fcd34d" size={14} />)}
                                            </div>
                                        </div>
                                        <p className="rev-content">{review.content}</p>
                                        {review.media_urls?.length > 0 && (
                                            <div className="rev-media-grid">
                                                {review.media_urls.map((url, i) => {
                                                    const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/) || url.includes('video');
                                                    return isVideo ? (
                                                        <video key={i} src={url} className="rev-media-thumb" controls />
                                                    ) : (
                                                        <img key={i} src={url} alt="Review" className="rev-media-thumb" onClick={() => window.open(url)} />
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <Footer />

            <style>{`
                .product-details-page { background: #f8fafc; min-height: 100vh; }
                .main-content { padding-top: 2rem; padding-bottom: 4rem; }
                .back-btn { background: transparent; display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-weight: 600; margin-bottom: 2rem; }
                .product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; background: white; padding: 2rem; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 4rem; }
                .main-image-container { width: 100%; aspect-ratio: 1; background: #f1f5f9; border-radius: 16px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
                .main-image { width: 90%; height: 90%; object-fit: contain; }
                .discount-tag { position: absolute; top: 1rem; left: 1rem; background: #ef4444; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 700; font-size: 0.85rem; }
                .thumbnails-scroll { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem; }
                .thumbnail { width: 80px; height: 80px; border-radius: 12px; border: 2px solid transparent; cursor: pointer; overflow: hidden; background: #f1f5f9; flex-shrink: 0; }
                .thumbnail.active { border-color: var(--primary); }
                .thumbnail img { width: 100%; height: 100%; object-fit: cover; }
                .product-title { font-size: 2.22rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
                .store-link { display: flex; align-items: center; gap: 0.5rem; color: #64748b; margin-bottom: 2rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; }
                .store-link strong { color: var(--primary); }
                .price-block { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 0.5rem; }
                .current-price { font-size: 2.8rem; font-weight: 800; color: #1e293b; }
                .mrp-block { color: #94a3b8; text-decoration: line-through; font-size: 1.2rem; }
                .tax-note { color: #10b981; font-size: 0.9rem; margin-bottom: 2.5rem; font-weight: 600; }
                .action-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 3rem; }
                .btn-add-cart-lg { background: #fff; border: 2px solid var(--primary); color: var(--primary); padding: 1.1rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.6rem; font-size: 1.1rem; }
                .btn-buy-now { background: var(--primary); color: white; padding: 1.1rem; border-radius: 12px; font-weight: 700; font-size: 1.1rem; }
                .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; background: #f8fafc; padding: 1.5rem; border-radius: 16px; }
                .feature-item { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #64748b; }

                /* REVIEWS SYSTEM */
                .reviews-section-luxury { margin-top: 5rem; }
                .reviews-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; }
                .reviews-header h2 { font-size: 2rem; font-weight: 800; }
                .rating-summary { display: flex; align-items: center; gap: 1.5rem; }
                .big-rating { font-size: 3.5rem; font-weight: 900; color: #1e293b; }
                .stars-box { display: flex; flex-direction: column; gap: 0.2rem; }
                .stars-box span { color: #64748b; font-size: 0.9rem; font-weight: 600; }

                .reviews-grid-main { display: grid; grid-template-columns: 350px 1fr; gap: 3rem; align-items: start; }
                .review-form-card { padding: 2rem; position: sticky; top: 100px; }
                .review-form-card h3 { margin-bottom: 1.5rem; font-weight: 800; }
                .stars-input { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
                .review-form-card textarea { width: 100%; height: 120px; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; resize: none; font-family: inherit; }
                .media-upload-row { margin-bottom: 1.5rem; }
                .media-btn { display: flex; align-items: center; gap: 0.5rem; color: var(--primary); font-weight: 700; cursor: pointer; font-size: 0.9rem; }
                .previews-row { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
                .mini-preview { width: 50px; height: 50px; border-radius: 6px; object-fit: cover; }

                .reviews-list { display: flex; flex-direction: column; gap: 1.5rem; }
                .review-item { padding: 2rem; }
                .review-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
                .reviewer { display: flex; gap: 1rem; align-items: center; }
                .rev-avatar { width: 44px; height: 44px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #475569; }
                .rev-name { font-weight: 700; color: #1e293b; }
                .rev-date { font-size: 0.8rem; color: #94a3b8; }
                .rev-content { color: #475569; line-height: 1.7; margin-bottom: 1.5rem; }
                .rev-media-grid { display: flex; gap: 1rem; flex-wrap: wrap; }
                .rev-media-thumb { width: 120px; height: 120px; border-radius: 10px; object-fit: cover; cursor: pointer; background: #000; }
                .no-reviews { text-align: center; padding: 4rem; color: #94a3b8; font-weight: 600; }

                @media (max-width: 1000px) {
                    .reviews-grid-main { grid-template-columns: 1fr; }
                    .review-form-card { position: static; }
                }
                @media (max-width: 900px) {
                    .product-grid { grid-template-columns: 1fr; gap: 2rem; }
                }

                .wishlist-btn-main {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .wishlist-btn-main:hover { color: #ef4444; transform: scale(1.1); }
                .wishlist-btn-main.liked { color: #ef4444; }
                .wishlist-btn-main:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default ProductDetails;
