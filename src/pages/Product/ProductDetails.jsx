import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard';
import SEO from '../../components/SEO';
import Navbar from '../../components/Navbar';
import {
    ShoppingCart, Heart, Star, Store, ArrowLeft,
    Share2, MapPin, ShieldCheck, RefreshCcw, Truck,
    ChevronRight, ChevronLeft, Info, MessageCircle, Clock, Camera,
    ChevronDown, ShieldAlert, Award
} from 'lucide-react';
import { useProduct } from '../../hooks/useProduct';
import ProductNotFound from './ProductNotFound';
import { addToRecentlyViewed } from '../../utils/recentlyViewed';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/productTranslations';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ImageLightbox from '../../components/ImageLightbox/ImageLightbox';
import { getProductImage, PLACEHOLDERS } from '../../utils/imageUtils';
import './ProductDetails.css';

const ProductDetails = () => {
    const { t, i18n } = useTranslation();
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart, cartCount } = useCart();
    const { user } = useAuth();

    const fromStoreCategory = location.state?.fromStoreCategory;
    const fromStoreName = location.state?.storeName;
    const fromCategoryName = location.state?.categoryName;

    // Data fetching via custom hook
    const { product, store, loading, error } = useProduct(productId);

    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('description');
    const [groupedSiblings, setGroupedSiblings] = useState([]); // products in same group
    
    // Variant Selection State
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selection, setSelection] = useState({
        color: null,
        size: null,
        design: null,
        volume: null
    });

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

        // Fetch grouped sibling products
        if (product.product_group_id) {
            supabase
                .from('products')
                .select('id, name, images, online_price, group_display_order, is_group_cover')
                .eq('product_group_id', product.product_group_id)
                .order('group_display_order', { ascending: true })
                .then(({ data }) => setGroupedSiblings(data || []));
        } else {
            setGroupedSiblings([]);
        }

        // Initialize selections if variants exist
        if (product.product_variants?.length > 0) {
            handleQuickVariantSelect(product.product_variants[0]);
        }
    }, [product, user]);

    // Derived variant lists
    const variants = product?.product_variants || [];
    const availableColors = [...new Set(variants.map(v => v.color).filter(Boolean))];
    const availableSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
    const availableDesigns = [...new Set(variants.map(v => v.design).filter(Boolean))];
    const availableVolumes = [...new Set(variants.map(v => v.volume).filter(Boolean))];

    const handleSelectOption = (type, value) => {
        const newSelection = { ...selection, [type]: selection[type] === value ? null : value };
        setSelection(newSelection);

        // Find the matching variant
        const exactMatch = variants.find(v => 
            (v.color === (newSelection.color || null)) &&
            (v.size === (newSelection.size || null)) &&
            (v.design === (newSelection.design || null)) &&
            (v.volume === (newSelection.volume || null))
        );

        if (exactMatch) {
            setSelectedVariant(exactMatch);
        } else {
            setSelectedVariant(null);
        }
    };

    const handleQuickVariantSelect = (variant) => {
        const newSelection = {
            color: variant.color || null,
            size: variant.size || null,
            design: variant.design || null,
            volume: variant.volume || null
        };
        setSelection(newSelection);
        setSelectedVariant(variant);
    };

    // Review Actions Logic
    const [reviewForm, setReviewForm] = useState({ rating: 5, content: '', media: [] });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMediaPreviews, setReviewMediaPreviews] = useState([]);
    // imageErrors must be declared here (before early returns) to satisfy Rules of Hooks
    const [imageErrors, setImageErrors] = useState({});

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

    const handleImageError = (index) => {
        setImageErrors(prev => ({ ...prev, [index]: true }));
    };

    const getImages = () => {
        if (!product) return [];
        let baseImages = [];
        if (Array.isArray(product.images) && product.images.length > 0) baseImages = product.images;
        else if (Array.isArray(product.image_urls) && product.image_urls.length > 0) baseImages = product.image_urls;
        else if (typeof product.image === 'string') baseImages = [product.image];
        else baseImages = [PLACEHOLDERS.PRODUCT];

        return baseImages.map((img, idx) => imageErrors[idx] ? PLACEHOLDERS.PRODUCT : img);
    };

    const images = getImages();
    const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0'; // Removed '4.8' fake default
    
    // Derived values
    const discount = product && product.mrp ? Math.round(((product.mrp - (product.online_price || product.price)) / product.mrp) * 100) : 0;
    const isOutOfStock = product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 0;

    const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": images,
        "description": product.description || `Buy ${product.name} from local stores near you.`,
        "brand": {
            "@type": "Brand",
            "name": store?.name || 'BuyLocal'
        },
        "offers": {
            "@type": "Offer",
            "url": typeof window !== 'undefined' ? window.location.href : '',
            "priceCurrency": "INR",
            "price": product.online_price || product.price,
            "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": store?.name || 'Local Store'
            }
        }
    };
    if (avgRating > 0 && reviews.length > 0) {
        productSchema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": avgRating,
            "reviewCount": reviews.length
        };
    }

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://buylocal.in/" },
            { "@type": "ListItem", "position": 2, "name": product.category || "Category", "item": `https://buylocal.in/category/${product.category}` },
            { "@type": "ListItem", "position": 3, "name": product.name }
        ]
    };

    return (
        <div className="pro-details-luxury">
            <SEO 
               title={`${product.name} - Buy online in ${store?.city || 'India'} | BuyLocal`}
               description={product.description || `Shop ${product.name} from local stores near you with fast delivery.`}
               canonicalUrl={typeof window !== 'undefined' ? window.location.href : ''}
               ogImage={images[0]}
               schema={[productSchema, breadcrumbSchema]}
            />
            <Navbar />
            <div className="container">
                {/* BREADCRUMBS */}
                {fromStoreCategory ? (
                    <nav className="breadcrumb-nav" style={{ padding: '1rem 0', margin: 0 }}>
                        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#64748b', fontWeight: '600', padding: 0 }}>
                            <ArrowLeft size={16} color="#64748b" /> Back to {fromCategoryName} in {fromStoreName}
                        </button>
                    </nav>
                ) : (
                    <nav className="breadcrumb-nav">
                        <Link to="/">{t('nav.home')}</Link>
                        <span className="breadcrumb-divider">/</span>
                        <Link to={`/category/${product.category}`}>{product.category}</Link>
                        <span className="breadcrumb-divider">/</span>
                        <span className="active">{product.name}</span>
                    </nav>
                )}

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
                                    <img 
                                        src={img} 
                                        alt={`thumbnail ${idx}`} 
                                        onError={() => handleImageError(idx)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COLUMN 2: HERO IMAGE */}
                    <div className="hero-column-wrapper">
                        <div className="hero-column" style={{ position: 'relative' }}>
                            <img 
                                src={selectedVariant?.image_url || images[selectedImageIndex]} 
                                alt={product.name} 
                                onClick={() => setShowLightbox(true)} 
                                onError={(e) => {
                                    if (selectedVariant?.image_url) {
                                        // If variant image fails, fallback to main gallery
                                        e.target.src = images[selectedImageIndex];
                                    } else {
                                        handleImageError(selectedImageIndex);
                                    }
                                }}
                                style={{ cursor: 'zoom-in', width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                            <div className="hero-badges" style={{ pointerEvents: 'none' }}>
                                <span className="badge-fast">Fast Delivery</span>
                            </div>
                            <button className="btn-wishlist-top" onClick={handleToggleWishlist}>
                                <Heart size={20} fill={isLiked ? "#ef4444" : "none"} color={isLiked ? "#ef4444" : "#1a1a1a"} />
                            </button>

                            {images.length > 1 && (
                                <>
                                    <button 
                                        className="slider-nav-btn prev"
                                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
                                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 5, color: '#0f172a' }}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button 
                                        className="slider-nav-btn next"
                                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 5, color: '#0f172a' }}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}
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
                            <span className="product-brand-info">{product.category}</span>
                            <h1 className="product-title-luxury">{getLocalizedName(product.name, i18n.language)}</h1>
                        </div>

                        {/* Styles Available (Grouped Products) — moved above price */}
                        {groupedSiblings.length > 1 && (
                            <div className="styles-available-section" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block', letterSpacing: '0.05em' }}>Styles Available</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {groupedSiblings.map(sibling => {
                                        const isActive = sibling.id === product.id;
                                        const thumb = Array.isArray(sibling.images) ? sibling.images[0] : null;
                                        return (
                                            <div
                                                key={sibling.id}
                                                title={sibling.name}
                                                onClick={() => !isActive && navigate(`/product/${sibling.id}`)}
                                                style={{
                                                    width: '58px', height: '58px', borderRadius: '12px', overflow: 'hidden',
                                                    cursor: isActive ? 'default' : 'pointer',
                                                    border: `2.5px solid ${isActive ? '#7c3aed' : '#e2e8f0'}`,
                                                    boxShadow: isActive ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                                                    transition: 'all 0.2s ease', padding: '2px', background: 'white',
                                                    flexShrink: 0, position: 'relative'
                                                }}
                                            >
                                                {thumb
                                                    ? <img src={thumb} alt={sibling.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                                    : <div style={{ width: '100%', height: '100%', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#94a3b8', fontWeight: '700', textAlign: 'center', padding: '4px' }}>{sibling.name?.slice(0, 8)}</div>
                                                }
                                                {sibling.is_group_cover && (
                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', fontSize: '0.45rem', fontWeight: '900', color: '#7c3aed', background: 'rgba(255,255,255,0.95)', padding: '2px 0' }}>COVER</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Styles Available (Legacy Variants fallback) — moved above price */}
                        {variants.length > 0 && variants.some(v => v.image_url) && !groupedSiblings.length && (
                            <div className="styles-available-section" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block', letterSpacing: '0.05em' }}>Styles Available</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {[...new Map(variants.filter(v => v.image_url).map(v => [v.image_url, v])).values()].map((v, i) => {
                                        const isSelected = selectedVariant?.id === v.id || (selectedVariant && selectedVariant.image_url === v.image_url);
                                        return (
                                            <div key={v.id || i} onClick={() => handleQuickVariantSelect(v)}
                                                style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                                                    border: `2px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}`,
                                                    boxShadow: isSelected ? '0 0 0 2px rgba(124,58,237,0.1)' : 'none',
                                                    transition: 'all 0.2s ease', padding: '2px', background: 'white'
                                                }}
                                            >
                                                <img src={v.image_url} alt="variant style" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}


                        <div className="pricing-luxury" style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', margin: '0.5rem 0 1.5rem' }}>
                            <span className="price-now" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#000' }}>
                                ₹{selectedVariant?.price || (product.online_price || product.price)}
                            </span>
                            {(selectedVariant?.market_price || product.offline_price || product.mrp) && (
                                <span className="price-mrp" style={{ fontSize: '1.25rem', color: '#64748b', textDecoration: 'line-through' }}>
                                    ₹{selectedVariant?.market_price || product.offline_price || product.mrp}
                                </span>
                            )}
                            {Math.round((( (selectedVariant?.market_price || product.offline_price || product.mrp) - (selectedVariant?.price || (product.online_price || product.price)) ) / (selectedVariant?.market_price || product.offline_price || product.mrp)) * 100) > 0 && (
                                <span style={{ 
                                    background: '#f0fdf4', 
                                    color: '#16a34a', 
                                    padding: '4px 10px', 
                                    borderRadius: '8px', 
                                    fontSize: '0.8rem', 
                                    fontWeight: '800',
                                    border: '1px solid #dcfce7'
                                }}>
                                    {Math.round((( (selectedVariant?.market_price || product.offline_price || product.mrp) - (selectedVariant?.price || (product.online_price || product.price)) ) / (selectedVariant?.market_price || product.offline_price || product.mrp)) * 100)}% OFF
                                </span>
                            )}
                        </div>
                        <p className="tax-disclaimer">Inclusive of all taxes and duties</p>

                        <div className="stock-status-luxury">
                            <div className={`stock-indicator ${(selectedVariant ? selectedVariant.stock_quantity <= 0 : isOutOfStock) ? 'red' : 'green'}`}></div>
                            <span>{(selectedVariant ? selectedVariant.stock_quantity <= 0 : isOutOfStock) ? 'OUT OF STOCK' : 'IN STOCK — READY TO SHIP'}</span>
                            {selectedVariant && selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity < 5 && (
                                <span style={{ color: '#ef4444', marginLeft: '8px', fontWeight: '700' }}>Only {selectedVariant.stock_quantity} left!</span>
                            )}
                        </div>


                        {/* VARIANT SELECTION UI */}
                        {variants.length > 0 && (
                            <div className="variant-selection-container" style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {availableColors.length > 0 && (
                                    <div className="selection-group">
                                        <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>Color: <span style={{ color: '#000' }}>{selection.color || 'Select'}</span></label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {availableColors.map(c => (
                                                <button 
                                                    key={c}
                                                    onClick={() => handleSelectOption('color', c)}
                                                    className={`selection-chip ${selection.color === c ? 'active' : ''}`}
                                                    style={{ 
                                                        padding: '8px 16px', 
                                                        borderRadius: '8px', 
                                                        border: `2px solid ${selection.color === c ? 'var(--primary)' : '#e2e8f0'}`,
                                                        background: selection.color === c ? '#f5f3ff' : 'white',
                                                        fontWeight: '700',
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {availableSizes.length > 0 && (
                                    <div className="selection-group">
                                        <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>Size: <span style={{ color: '#000' }}>{selection.size || 'Select'}</span></label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {availableSizes.map(s => (
                                                <button 
                                                    key={s}
                                                    onClick={() => handleSelectOption('size', s)}
                                                    className={`selection-chip ${selection.size === s ? 'active' : ''}`}
                                                    style={{ 
                                                        padding: '8px 16px', 
                                                        borderRadius: '30px', 
                                                        border: `2px solid ${selection.size === s ? 'var(--primary)' : '#e2e8f0'}`,
                                                        background: selection.size === s ? '#f5f3ff' : 'white',
                                                        fontWeight: '700',
                                                        minWidth: '60px'
                                                    }}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(availableDesigns.length > 0 || availableVolumes.length > 0) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {availableDesigns.length > 0 && (
                                            <div className="selection-group">
                                                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b' }}>Design</label>
                                                <select 
                                                    value={selection.design || ''} 
                                                    onChange={(e) => handleSelectOption('design', e.target.value)}
                                                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '0 8px' }}
                                                >
                                                    <option value="">Select Design</option>
                                                    {availableDesigns.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        {availableVolumes.length > 0 && (
                                            <div className="selection-group">
                                                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b' }}>Volume</label>
                                                <select 
                                                    value={selection.volume || ''} 
                                                    onChange={(e) => handleSelectOption('volume', e.target.value)}
                                                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '0 8px' }}
                                                >
                                                    <option value="">Select Volume</option>
                                                    {availableVolumes.map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="action-buttons-luxury mobile-hidden">
                            <button 
                                className={`btn-buy-now ${(isOutOfStock || (variants.length > 0 && !selectedVariant) || (selectedVariant && selectedVariant.stock_quantity <= 0)) ? 'disabled' : ''}`}
                                disabled={isOutOfStock || (variants.length > 0 && !selectedVariant) || (selectedVariant && selectedVariant.stock_quantity <= 0)}
                                onClick={() => {
                                    if (variants.length > 0 && !selectedVariant) return alert('Please select a variant first.');
                                    if (selectedVariant && selectedVariant.stock_quantity <= 0) return alert('This variant is out of stock.');
                                    if (!isOutOfStock) {
                                        addToCart({ ...product, stores: store }, 1, selectedVariant);
                                        navigate('/cart');
                                    }
                                }}
                            >
                                {variants.length > 0 && !selectedVariant ? 'Select Variant' : 'Buy It Now'}
                            </button>
                            <button 
                                className={`btn-add-bag ${(isOutOfStock || (variants.length > 0 && !selectedVariant) || (selectedVariant && selectedVariant.stock_quantity <= 0)) ? 'disabled' : ''}`}
                                disabled={isOutOfStock || (variants.length > 0 && !selectedVariant) || (selectedVariant && selectedVariant.stock_quantity <= 0)}
                                onClick={() => {
                                    if (variants.length > 0 && !selectedVariant) return alert('Please select a variant first.');
                                    if (selectedVariant && selectedVariant.stock_quantity <= 0) return alert('This variant is out of stock.');
                                    if (!isOutOfStock) {
                                        addToCart({ ...product, stores: store }, 1, selectedVariant);
                                        alert('Added to Bag!');
                                    }
                                }}
                            >
                                Add to Bag
                            </button>
                        </div>

                        {/* PRODUCT TRUST & VARIANTS SECTION */}
                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                            {/* Trust Badges */}
                            <div className="product-trust-highlights" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="trust-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
                                    <Award size={16} color="#7c3aed" /> <span>Quality Product</span>
                                </div>
                                <div className="trust-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
                                    <Truck size={16} color="#7c3aed" /> <span>COD Available</span>
                                </div>
                                <div className="trust-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
                                    <Clock size={16} color="#7c3aed" /> <span>Fast Delivery</span>
                                </div>
                                <div className="trust-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
                                    <ShieldCheck size={16} color="#7c3aed" /> <span>No Return Policy</span>
                                </div>
                            </div>

                            {/* Rating Row */}
                            <div className="rating-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div className="stars-group" style={{ display: 'flex', gap: '2px' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < Math.round(Number(avgRating)) ? "#7c3aed" : "none"} color="#7c3aed" />
                                    ))}
                                </div>
                                <span className="rating-text" style={{ fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8' }}>
                                    {avgRating > 0 ? `${avgRating} (${reviews.length} reviews)` : 'No reviews yet'}
                                </span>
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
                                    <p style={{ whiteSpace: 'pre-line' }}>{getLocalizedName(product.description, i18n.language) || "No description provided by the seller."}</p>
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

                                <div className="store-stats-luxury" style={{ display: 'none' }}>
                                    {/* Stats hidden until dynamic tracking is implemented */}
                                    <div className="stat-luxury-row">
                                        <span className="stat-lux-label">Rating</span>
                                        <span className="stat-lux-value">{store?.avg_rating || 'N/A'}</span>
                                    </div>
                                    <div className="stat-luxury-row">
                                        <span className="stat-lux-label">Followers</span>
                                        <span className="stat-lux-value">{store?.follower_count || '0'}</span>
                                    </div>
                                    <div className="stat-luxury-row">
                                        <span className="stat-lux-label">Dispatch</span>
                                        <span className="stat-lux-value green">Ready</span>
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
                        className={`btn-outline-purple ${(isOutOfStock || (variants.length > 0 && !selectedVariant) || (selectedVariant && selectedVariant.stock_quantity <= 0)) ? 'disabled' : ''}`}
                        disabled={isOutOfStock || (variants.length > 0 && !selectedVariant) || (selectedVariant && selectedVariant.stock_quantity <= 0)}
                        onClick={() => {
                            if (variants.length > 0 && !selectedVariant) return alert('Please select a variant first.');
                            if (selectedVariant && selectedVariant.stock_quantity <= 0) return alert('This variant is out of stock.');
                            if (!isOutOfStock) {
                                addToCart({ ...product, stores: store }, 1, selectedVariant);
                                alert('Added to Bag!');
                            }
                        }}
                    >
                        Add to Bag
                    </button>
                    <button 
                        className={`btn-solid-purple ${(isOutOfStock || (variants.length > 0 && !selectedVariant) || (selectedVariant && selectedVariant.stock_quantity <= 0)) ? 'disabled' : ''}`}
                        disabled={isOutOfStock || (variants.length > 0 && !selectedVariant) || (selectedVariant && selectedVariant.stock_quantity <= 0)}
                        onClick={() => {
                            if (variants.length > 0 && !selectedVariant) return alert('Please select a variant first.');
                            if (selectedVariant && selectedVariant.stock_quantity <= 0) return alert('This variant is out of stock.');
                            if (!isOutOfStock) {
                                addToCart({ ...product, stores: store }, 1, selectedVariant);
                                navigate('/cart');
                            }
                        }}
                    >
                        Buy Now
                    </button>
                </div>
            </div>

            {showLightbox && (
                <ImageLightbox 
                    images={images} 
                    currentIndex={selectedImageIndex} 
                    onClose={() => setShowLightbox(false)} 
                />
            )}
        </div>
    );
};

export default ProductDetails;
