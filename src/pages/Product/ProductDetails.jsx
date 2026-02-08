import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ShoppingCart, Heart, Star, Store, ArrowLeft, Share2, MapPin } from 'lucide-react';

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                setLoading(true);

                // 1. Fetch Product
                const { data: productData, error: productError } = await withTimeout(
                    supabase
                        .from('products')
                        .select('*')
                        .eq('id', productId)
                        .single()
                );

                if (productError) throw productError;
                if (!productData) throw new Error('Product not found');

                setProduct(productData);

                // 2. Fetch Associated Store
                if (productData.store_id) {
                    const { data: storeData } = await withTimeout(
                        supabase
                            .from('stores')
                            .select('*')
                            .eq('id', productData.store_id)
                            .single()
                    );
                    setStore(storeData);
                }

            } catch (err) {
                console.error('Error fetching product details:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProductDetails();
        }
    }, [productId]);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
        }
    };

    // Helper to get image array
    const getImages = () => {
        if (!product) return [];
        if (Array.isArray(product.images) && product.images.length > 0) return product.images;
        if (Array.isArray(product.image_urls) && product.image_urls.length > 0) return product.image_urls;
        if (typeof product.image === 'string') return [product.image];
        return ['https://via.placeholder.com/600x600?text=No+Image'];
    };

    const images = getImages();

    if (loading) return (
        <div className="loader-container">
            <div className="loader"></div>
        </div>
    );

    if (error || !product) return (
        <div className="error-page">
            <Navbar />
            <div className="container error-content">
                <h2>oops! Product Not Found</h2>
                <p>{error || "The product you are looking for doesn't exist."}</p>
                <Link to="/" className="btn-primary">Back to Home</Link>
            </div>
            <Footer />
            <style>{`
                .error-content { 
                    min-height: 60vh; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    text-align: center;
                    gap: 1rem;
                }
            `}</style>
        </div>
    );

    const discount = product.mrp ? Math.round(((product.mrp - (product.online_price || product.price)) / product.mrp) * 100) : 0;

    return (
        <div className="product-details-page">
            <Navbar />

            <div className="container main-content">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={20} /> Back
                </button>

                <div className="product-grid">
                    {/* Left: Image Gallery */}
                    <div className="gallery-section">
                        <div className="main-image-container">
                            <img
                                src={images[selectedImageIndex]}
                                alt={product.name}
                                className="main-image"
                            />
                            {discount > 0 && <span className="discount-tag">-{discount}% OFF</span>}
                        </div>

                        {images.length > 1 && (
                            <div className="thumbnails-scroll">
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`thumbnail ${idx === selectedImageIndex ? 'active' : ''}`}
                                        onClick={() => setSelectedImageIndex(idx)}
                                    >
                                        <img src={img} alt={`View ${idx + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Info */}
                    <div className="info-section">
                        <div className="product-header">
                            <h1 className="product-title">{product.name}</h1>
                            <div className="share-actions">
                                <button className="icon-btn"><Share2 size={20} /></button>
                                <button className="icon-btn"><Heart size={20} /></button>
                            </div>
                        </div>

                        {store && (
                            <Link to={`/store/${store.id}`} className="store-link">
                                <Store size={18} />
                                <span>Sold by <strong>{store.name}</strong></span>
                                {store.rating && (
                                    <span className="rating-badge">
                                        <Star size={12} fill="currentColor" /> {store.rating}
                                    </span>
                                )}
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
                            <button className="btn-add-cart-lg" onClick={handleAddToCart}>
                                <ShoppingCart size={20} /> Add to Cart
                            </button>
                            <button className="btn-buy-now">Buy Now</button>
                        </div>

                        <div className="description-block">
                            <h3>Description</h3>
                            <p>{product.description || "No description available for this product."}</p>
                        </div>

                        <div className="features-grid">
                            <div className="feature-item">
                                <span className="feature-icon">🚚</span>
                                <span>Fast Delivery</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">🛡️</span>
                                <span>Local Warranty</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">↩️</span>
                                <span>Easy Returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            <style>{`
                .product-details-page {
                    background: #f8fafc;
                    min-height: 100vh;
                }
                .main-content {
                    padding-top: 2rem;
                    padding-bottom: 4rem;
                }
                .back-btn {
                    background: transparent;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-muted);
                    font-weight: 600;
                    margin-bottom: 2rem;
                }
                .back-btn:hover { color: var(--primary); }

                .product-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem;
                    background: white;
                    padding: 2rem;
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-sm);
                }

                /* Gallery */
                .gallery-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .main-image-container {
                    width: 100%;
                    aspect-ratio: 1;
                    background: #f1f5f9;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .main-image {
                    width: 90%;
                    height: 90%;
                    object-fit: contain;
                }
                .discount-tag {
                    position: absolute;
                    top: 1rem;
                    left: 1rem;
                    background: var(--error);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    font-weight: 700;
                    font-size: 0.85rem;
                }
                .thumbnails-scroll {
                    display: flex;
                    gap: 1rem;
                    overflow-x: auto;
                    padding-bottom: 0.5rem;
                }
                .thumbnail {
                    width: 80px;
                    height: 80px;
                    border-radius: var(--radius-md);
                    border: 2px solid transparent;
                    cursor: pointer;
                    overflow: hidden;
                    background: #f1f5f9;
                    flex-shrink: 0;
                }
                .thumbnail.active {
                    border-color: var(--primary);
                }
                .thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                /* Info Section */
                .info-section {
                    display: flex;
                    flex-direction: column;
                }
                .product-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                .product-title {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--text-main);
                    line-height: 1.2;
                }
                .share-actions { display: flex; gap: 0.5rem; }
                .icon-btn {
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    color: var(--text-muted);
                }
                .icon-btn:hover { background: #e2e8f0; color: var(--primary); }

                .store-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-muted);
                    font-size: 0.95rem;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border);
                    width: 100%;
                }
                .store-link strong { color: var(--primary); }
                .rating-badge {
                    background: #fcd34d;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    color: #78350f;
                }

                .price-block {
                    display: flex;
                    align-items: flex-end;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }
                .current-price {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: var(--text-main);
                }
                .mrp-block {
                    color: var(--text-muted);
                    text-decoration: line-through;
                    font-size: 1.1rem;
                }
                .tax-note {
                    color: var(--success);
                    font-size: 0.9rem;
                    margin-bottom: 2rem;
                    font-weight: 500;
                }

                .action-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 3rem;
                }
                .btn-add-cart-lg {
                    background: white;
                    border: 2px solid var(--primary);
                    color: var(--primary);
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-size: 1.1rem;
                }
                .btn-add-cart-lg:hover { background: #eef2ff; }
                .btn-buy-now {
                    background: var(--primary);
                    color: white;
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                .btn-buy-now:hover { background: var(--primary-hover); }

                .description-block { margin-bottom: 2rem; }
                .description-block h3 { margin-bottom: 0.75rem; font-size: 1.2rem; }
                .description-block p { color: var(--text-muted); line-height: 1.7; }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    background: #f8fafc;
                    padding: 1.5rem;
                    border-radius: var(--radius-lg);
                }
                .feature-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    text-align: center;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-muted);
                }
                .feature-icon { font-size: 1.5rem; }

                @media (max-width: 900px) {
                    .product-grid { grid-template-columns: 1fr; gap: 2rem; }
                }
            `}</style>
        </div>
    );
};

export default ProductDetails;
