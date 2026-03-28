import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Store, Package, SlidersHorizontal, X, Heart, Navigation, Star, ArrowUp } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const StoreCategoryView = () => {
    const { t } = useTranslation();
    const { storeName, categoryName } = useParams();
    const navigate = useNavigate();

    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const decodedCategoryName = decodeURIComponent(categoryName);

    // Filter states
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState('none');
    const [tempSortOrder, setTempSortOrder] = useState('none');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [tempMinPrice, setTempMinPrice] = useState('');
    const [tempMaxPrice, setTempMaxPrice] = useState('');
    const [activeFilterCount, setActiveFilterCount] = useState(0);

    useEffect(() => {
        const fetchCategoryData = async () => {
            try {
                const { data: storeData, error: storeError } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('name', decodeURIComponent(storeName))
                    .single();

                if (storeError) throw storeError;
                setStore(storeData);

                if (storeData) {
                    const { data: productsData, error: productsError } = await supabase
                        .from('products')
                        .select('*')
                        .eq('store_id', storeData.id);

                    if (productsError) throw productsError;
                    
                    // Filter by hardcoded category field OR tag-based match
                    const categoryMatch = (productsData || []).filter(p => 
                        (p.category && p.category.toLowerCase() === decodedCategoryName.toLowerCase()) || 
                        p.tags?.some(tag => tag.toLowerCase() === decodedCategoryName.toLowerCase())
                    );
                    
                    setProducts(categoryMatch);
                }

            } catch (error) {
                console.error('Error fetching category products:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryData();
    }, [storeName, decodedCategoryName]);

    // Open filter drawer
    const openFilter = () => {
        setTempSortOrder(sortOrder);
        setTempMinPrice(minPrice);
        setTempMaxPrice(maxPrice);
        setIsFilterOpen(true);
        document.body.style.overflow = 'hidden';
    };

    // Close filter drawer
    const closeFilter = () => {
        setIsFilterOpen(false);
        document.body.style.overflow = '';
    };

    // Apply filters
    const applyFilters = () => {
        setSortOrder(tempSortOrder);
        setMinPrice(tempMinPrice);
        setMaxPrice(tempMaxPrice);

        let count = 0;
        if (tempSortOrder !== 'none') count++;
        if (tempMinPrice || tempMaxPrice) count++;
        setActiveFilterCount(count);

        closeFilter();
    };

    // Clear all filters
    const clearFilters = () => {
        setTempSortOrder('none');
        setTempMinPrice('');
        setTempMaxPrice('');
    };

    if (loading) return <LoadingSpinner fullPage />;
    if (!store) return <div className="error-container">Store not found</div>;

    // Apply price filter
    let filteredProducts = [...products];
    if (minPrice) {
        filteredProducts = filteredProducts.filter(p => (p.online_price || p.price || 0) >= Number(minPrice));
    }
    if (maxPrice) {
        filteredProducts = filteredProducts.filter(p => (p.online_price || p.price || 0) <= Number(maxPrice));
    }

    // Apply sort
    if (sortOrder === 'asc') {
        filteredProducts.sort((a, b) => (a.online_price || a.price || 0) - (b.online_price || b.price || 0));
    } else if (sortOrder === 'desc') {
        filteredProducts.sort((a, b) => (b.online_price || b.price || 0) - (a.online_price || a.price || 0));
    }

    const getProductImage = (product) => {
        if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
        if (Array.isArray(product.image_urls) && product.image_urls.length > 0) return product.image_urls[0];
        if (typeof product.image === 'string') return product.image;
        if (typeof product.image_url === 'string') return product.image_url;
        return 'https://via.placeholder.com/300x400?text=No+Image';
    };

    return (
        <div className="store-category-page">
            <Navbar />
            
            <div className="container custom-container" style={{ marginTop: '70px' }}>
                {/* Header Card */}
                <div className="store-info-card" onClick={() => navigate(`/${store.name}`)}>
                    <div className="info-left">
                        <div className="store-avatar">
                            {store.profile_picture_url ? (
                                <img src={store.profile_picture_url} alt={store.name} />
                            ) : (
                                <Store size={22} color="#8c5a3c" />
                            )}
                        </div>
                        <div className="store-text">
                            <h2 className="store-name">{store.name}</h2>
                            <span className="store-subtitle">STORE PARTNER</span>
                        </div>
                    </div>
                    <div className="info-right">
                        <div className="info-stat">
                            <Star size={12} fill="#2c241e" color="#2c241e" />
                            <span>{store.average_rating || '4.8'}</span>
                        </div>
                        <div className="info-stat">
                            <Navigation size={12} fill="#2c241e" color="#2c241e" style={{ transform: 'rotate(45deg)' }} />
                            <span>1.2km</span>
                        </div>
                    </div>
                </div>

                {/* Category Title */}
                <div className="category-header-wrap">
                    <h1 className="category-title">{decodedCategoryName}</h1>
                    <span className="category-count">{filteredProducts.length} products found</span>
                </div>

                {products.length > 0 ? (
                    <>
                        {/* Sort/Filter Row */}
                        <div className="controls-row">
                            <span className="products-visible-text">1 OF {filteredProducts.length} PRODUCTS</span>
                            <button className="sort-pill" onClick={openFilter}>
                                <SlidersHorizontal size={14} />
                                Sort
                            </button>
                        </div>

                        {/* Product Grid */}
                        <div className="category-grid">
                            {filteredProducts.map(product => {
                                // Just a simple dummy check for 'new' badge logic based on created_at
                                const isNew = product.created_at && (Date.now() - new Date(product.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000;
                                return (
                                    <div className="product-card-inline" key={product.id} onClick={() => navigate(`/product/${product.id}`, { state: { fromStoreCategory: true, storeName: store.name, categoryName: decodedCategoryName } })}>
                                        <div className="product-image-wrap">
                                            <img src={getProductImage(product)} alt={product.name} />
                                            <button className="fav-btn" onClick={(e) => { e.stopPropagation(); /* Favorite Logic here */ }}>
                                                <Heart size={16} fill="#5b0a51" color="#5b0a51" />
                                            </button>
                                            {isNew && <span className="new-badge">NEW</span>}
                                        </div>
                                        <div className="product-details">
                                            <h3 className="product-name">{product.name}</h3>
                                            <div className="price-row">
                                                <span className="product-price">₹{product.online_price || product.price}</span>
                                                <div className="product-rating">
                                                    <Star size={10} fill="#2c241e" color="#2c241e" />
                                                    <span>4.9</span>
                                                </div>
                                            </div>
                                            <span className="product-brand">{product.brand || 'VEDA ORIGINALS'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Bottom */}
                        <div className="bottom-pagination">
                            <div className="dots">
                                <span className="dot active"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                            <span className="discovering-text">DISCOVERING MORE TREASURES...</span>
                        </div>
                    </>
                ) : (
                    <div className="empty-category-state" style={{ textAlign: 'center', padding: '5rem 1rem', color: '#64748b' }}>
                        <Package size={48} color="#cbd5e1" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>No products found</h3>
                        <p>There are no products currently listed in "{decodedCategoryName}".</p>
                        <button onClick={() => navigate(-1)} style={{ marginTop: '1.5rem', background: '#5b0a51', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            Go Back
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            {products.length > 0 && (
                <button className="fab-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <ArrowUp size={18} color="#fff" />
                </button>
            )}

            {/* FILTER SIDEBAR OVERLAY */}
            {isFilterOpen && (
                <div className="ss-filter-overlay" onClick={closeFilter}>
                    <div className="ss-filter-drawer" onClick={e => e.stopPropagation()}>
                        <div className="ss-drawer-header">
                            <h3>Sort & Filter</h3>
                            <button className="ss-drawer-close" onClick={closeFilter}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="ss-drawer-body">
                            <div className="ss-filter-section">
                                <h4 className="ss-filter-label">Sort By</h4>
                                <div className="ss-sort-options">
                                    {[
                                        { value: 'none', label: 'Default' },
                                        { value: 'asc', label: 'Price: Low to High' },
                                        { value: 'desc', label: 'Price: High to Low' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            className={`ss-sort-chip ${tempSortOrder === opt.value ? 'active' : ''}`}
                                            onClick={() => setTempSortOrder(opt.value)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="ss-drawer-footer">
                            <button className="ss-clear-btn" onClick={clearFilters}>Clear All</button>
                            <button className="ss-apply-btn" onClick={applyFilters}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                .store-category-page {
                    font-family: 'Inter', sans-serif;
                    background: #fdfaf3;
                    min-height: 100vh;
                    padding-bottom: 6rem;
                }

                .custom-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 1.25rem;
                }

                /* STORE INFO CARD */
                .store-info-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #f4ecd8;
                    padding: 0.85rem 1rem;
                    border-radius: 99px; /* Pill shape */
                    margin-bottom: 2rem;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .store-info-card:active {
                    transform: scale(0.98);
                }
                
                .info-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .store-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: #fbdec9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .store-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .store-text {
                    display: flex;
                    flex-direction: column;
                }
                .store-name {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #2c241e;
                    margin: 0;
                    line-height: 1;
                }
                .store-subtitle {
                    font-size: 0.6rem;
                    color: #8b8b8b;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                }
                
                .info-right {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.25rem;
                }
                .info-stat {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.75rem;
                    color: #2c241e;
                    font-weight: 700;
                }

                /* CATEGORY HEADER */
                .category-header-wrap {
                    margin-bottom: 2rem;
                }
                .category-title {
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: #5b0a51;
                    margin: 0 0 0.5rem 0;
                    letter-spacing: -0.02em;
                }
                .category-count {
                    font-size: 0.9rem;
                    color: #64748b;
                    font-weight: 500;
                }

                /* CONTROLS ROW */
                .controls-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .products-visible-text {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    letter-spacing: 0.05em;
                }
                .sort-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    background: #faebd7;
                    color: #2c241e;
                    font-size: 0.8rem;
                    font-weight: 700;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    border: none;
                    cursor: pointer;
                }

                /* PRODUCT GRID */
                .category-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.25rem;
                }
                @media (min-width: 768px) {
                    .category-grid { grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
                }
                @media (min-width: 1024px) {
                    .category-grid { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
                    .custom-container { padding: 0; }
                }

                /* INLINE PRODUCT CARD */
                .product-card-inline {
                    display: flex;
                    flex-direction: column;
                    cursor: pointer;
                    background: transparent;
                }
                .product-image-wrap {
                    width: 100%;
                    aspect-ratio: 0.75;
                    border-radius: 20px;
                    overflow: hidden;
                    position: relative;
                    background: #1e293b; /* Fallback dark bg */
                    margin-bottom: 0.75rem;
                }
                .product-image-wrap img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .fav-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.8);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                    z-index: 2;
                }
                .new-badge {
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    background: #faebd7;
                    color: #2c241e;
                    font-size: 0.6rem;
                    font-weight: 800;
                    padding: 0.35rem 0.6rem;
                    border-radius: 6px;
                    z-index: 2;
                }
                
                .product-details {
                    display: flex;
                    flex-direction: column;
                }
                .product-name {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 0.4rem 0;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .price-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.3rem;
                }
                .product-price {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #5b0a51;
                }
                .product-rating {
                    display: flex;
                    align-items: center;
                    gap: 0.2rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #2c241e;
                }
                .product-brand {
                    font-size: 0.65rem;
                    color: #94a3b8;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }

                /* PAGINATION BOTTOM */
                .bottom-pagination {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-top: 3.5rem;
                    margin-bottom: 2rem;
                }
                .dots {
                    display: flex;
                    gap: 0.4rem;
                    margin-bottom: 1rem;
                }
                .dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #d1d5db;
                }
                .dot.active {
                    background: #5b0a51;
                }
                .discovering-text {
                    font-size: 0.65rem;
                    color: #94a3b8;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                }

                /* FAB */
                .fab-top {
                    position: fixed;
                    bottom: 100px; /* Moved up to clear location button */
                    right: 24px;
                    width: 44px; /* Made smaller */
                    height: 44px; /* Made smaller */
                    border-radius: 50%;
                    background: #5b0a51;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 14px rgba(91, 10, 81, 0.4);
                    z-index: 99;
                    transition: transform 0.2s;
                }
                .fab-top:active {
                    transform: scale(0.95);
                }

                /* FILTER OVERLAY & DRAWER (Reused basic styles) */
                .ss-filter-overlay {
                    position: fixed; inset: 0; z-index: 9999;
                    background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(4px);
                    display: flex; justify-content: flex-end;
                    animation: overlayIn 0.25s ease;
                }
                @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

                .ss-filter-drawer {
                    width: 340px; max-width: 85vw; height: 100%;
                    background: #fff; display: flex; flex-direction: column;
                    animation: drawerSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes drawerSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }

                .ss-drawer-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9;
                }
                .ss-drawer-header h3 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0; }
                .ss-drawer-close { width: 36px; height: 36px; border-radius: 50%; background: #f8fafc; border: none; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; }

                .ss-drawer-body { flex: 1; overflow-y: auto; padding: 1.5rem; }
                .ss-filter-section { margin-bottom: 2rem; }
                .ss-filter-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; margin-top: 0; }
                .ss-sort-options { display: flex; flex-direction: column; gap: 0.5rem; }
                .ss-sort-chip { padding: 0.75rem 1rem; border-radius: 10px; border: 1.5px solid #f1f5f9; background: #fafafa; color: #475569; font-size: 0.85rem; font-weight: 600; cursor: pointer; text-align: left; }
                .ss-sort-chip.active { border-color: #5b0a51; background: #faf5fa; color: #5b0a51; box-shadow: 0 2px 8px rgba(91, 10, 81, 0.1); }

                .ss-drawer-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; gap: 0.75rem; }
                .ss-clear-btn { flex: 1; padding: 0.75rem; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; font-weight: 700; cursor: pointer; }
                .ss-apply-btn { flex: 2; padding: 0.75rem; border-radius: 12px; border: none; background: #5b0a51; color: white; font-weight: 700; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default StoreCategoryView;
