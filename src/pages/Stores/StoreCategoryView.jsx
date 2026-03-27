
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Store, Package, SlidersHorizontal, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
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
                        .eq('store_id', storeData.id)
                        .eq('category', decodedCategoryName);

                    if (productsError) throw productsError;
                    setProducts(productsData || []);
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

    return (
        <div className="store-category-page">
            <Navbar />
            
            <div className="container" style={{ marginTop: '100px', paddingBottom: '4rem' }}>
                {/* Header Section */}
                <div className="category-view-header" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <button onClick={() => navigate(-1)} className="back-btn-minimal" style={{
                        width: '44px', height: '44px', borderRadius: '50%', background: '#fff', border: '1.5px solid #f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: '0.2s', cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8c5a3c', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                            <Store size={14} />
                            <span>{store.name}</span>
                        </div>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1e293b', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                            {decodedCategoryName}
                        </h1>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>
                            {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} found
                        </div>
                    </div>
                </div>

                {products.length > 0 ? (
                    <>
                        {/* Filter Row */}
                        <div className="ss-title-row">
                            <div className="ss-title-left">
                                <span className="ss-item-count">{filteredProducts.length} of {products.length} products</span>
                            </div>
                            <button className="ss-filter-btn" onClick={openFilter}>
                                <SlidersHorizontal size={16} />
                                <span>Filter</span>
                                {activeFilterCount > 0 && (
                                    <span className="ss-filter-badge">{activeFilterCount}</span>
                                )}
                            </button>
                        </div>

                        {/* Active filter tags */}
                        {activeFilterCount > 0 && (
                            <div className="ss-active-filters">
                                {sortOrder !== 'none' && (
                                    <span className="ss-filter-tag">
                                        {sortOrder === 'asc' ? '↑ Low to High' : '↓ High to Low'}
                                        <X size={12} onClick={() => { setSortOrder('none'); setActiveFilterCount(prev => prev - 1); }} />
                                    </span>
                                )}
                                {(minPrice || maxPrice) && (
                                    <span className="ss-filter-tag">
                                        ₹{minPrice || '0'} – ₹{maxPrice || '∞'}
                                        <X size={12} onClick={() => { setMinPrice(''); setMaxPrice(''); setActiveFilterCount(prev => prev - 1); }} />
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="category-products-grid">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={{ ...product, storeName: store.name }} />
                            ))}
                        </div>

                        {filteredProducts.length === 0 && products.length > 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                                <p>No products match the selected filters.</p>
                                <button onClick={() => { setSortOrder('none'); setMinPrice(''); setMaxPrice(''); setActiveFilterCount(0); }}
                                    style={{ marginTop: '1rem', background: '#8c5a3c', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-category-state" style={{ textAlign: 'center', padding: '5rem 1rem', color: '#64748b', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                        <Package size={48} color="#cbd5e1" style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>No products found</h3>
                        <p>There are no products currently listed in the "{decodedCategoryName}" category.</p>
                        <button onClick={() => navigate(-1)} style={{ marginTop: '1.5rem', background: '#8c5a3c', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            Go Back
                        </button>
                    </div>
                )}
            </div>

            {/* FILTER SIDEBAR OVERLAY */}
            {isFilterOpen && (
                <div className="ss-filter-overlay" onClick={closeFilter}>
                    <div className="ss-filter-drawer" onClick={e => e.stopPropagation()}>
                        {/* Drawer Header */}
                        <div className="ss-drawer-header">
                            <h3>Filters</h3>
                            <button className="ss-drawer-close" onClick={closeFilter}>
                                <X size={22} />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="ss-drawer-body">
                            {/* Sort Options */}
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

                            {/* Price Range */}
                            <div className="ss-filter-section">
                                <h4 className="ss-filter-label">Price Range</h4>
                                <div className="ss-price-inputs">
                                    <div className="ss-price-field">
                                        <span className="ss-price-prefix">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={tempMinPrice}
                                            onChange={e => setTempMinPrice(e.target.value)}
                                        />
                                    </div>
                                    <span className="ss-price-dash">–</span>
                                    <div className="ss-price-field">
                                        <span className="ss-price-prefix">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={tempMaxPrice}
                                            onChange={e => setTempMaxPrice(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {/* Quick presets */}
                                <div className="ss-price-presets">
                                    {[
                                        { label: 'Under ₹500', min: '', max: '500' },
                                        { label: '₹500 – ₹1000', min: '500', max: '1000' },
                                        { label: '₹1000 – ₹2000', min: '1000', max: '2000' },
                                        { label: 'Above ₹2000', min: '2000', max: '' },
                                    ].map((preset, idx) => (
                                        <button
                                            key={idx}
                                            className={`ss-preset-chip ${tempMinPrice === preset.min && tempMaxPrice === preset.max ? 'active' : ''}`}
                                            onClick={() => { setTempMinPrice(preset.min); setTempMaxPrice(preset.max); }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="ss-drawer-footer">
                            <button className="ss-clear-btn" onClick={clearFilters}>Clear All</button>
                            <button className="ss-apply-btn" onClick={applyFilters}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@400;700;800&display=swap');

                .store-category-page {
                    font-family: 'Inter', sans-serif;
                    background: #fdfcfb;
                    min-height: 100vh;
                }

                .category-products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 1rem;
                }

                @media (min-width: 1024px) {
                    .category-products-grid {
                        grid-template-columns: repeat(6, 1fr) !important;
                        gap: 1.5rem !important;
                    }
                }
                @media (max-width: 768px) {
                    .category-products-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 0.75rem !important;
                    }
                    .category-view-header h1 { font-size: 1.8rem !important; }
                }

                /* TITLE ROW */
                .ss-title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.25rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 2px solid #f1f5f9;
                }
                .ss-title-left h2 {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #334155;
                    margin: 0;
                }
                .ss-item-count {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    font-weight: 500;
                }

                /* FILTER BUTTON */
                .ss-filter-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.55rem 1rem;
                    border-radius: 10px;
                    border: 1.5px solid #e2e8f0;
                    background: #fff;
                    color: #475569;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }
                .ss-filter-btn:hover {
                    border-color: #8c5a3c;
                    color: #8c5a3c;
                    background: #fef8f4;
                }
                .ss-filter-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #8c5a3c;
                    color: white;
                    font-size: 0.6rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* ACTIVE FILTER TAGS */
                .ss-active-filters {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    margin-bottom: 1rem;
                }
                .ss-filter-tag {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 8px;
                    background: #fef8f4;
                    border: 1px solid #f0ddd0;
                    color: #8c5a3c;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .ss-filter-tag svg {
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }
                .ss-filter-tag svg:hover {
                    opacity: 1;
                }

                /* FILTER OVERLAY */
                .ss-filter-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(4px);
                    display: flex;
                    justify-content: flex-end;
                    animation: ssOverlayIn 0.25s ease;
                }
                @keyframes ssOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                /* FILTER DRAWER */
                .ss-filter-drawer {
                    width: 340px;
                    max-width: 85vw;
                    height: 100%;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                    animation: ssDrawerSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: -8px 0 30px rgba(0,0,0,0.08);
                }
                @keyframes ssDrawerSlide {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                /* DRAWER HEADER */
                .ss-drawer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                }
                .ss-drawer-header h3 {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0;
                }
                .ss-drawer-close {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: #f8fafc;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .ss-drawer-close:hover {
                    background: #f1f5f9;
                    color: #1e293b;
                }

                /* DRAWER BODY */
                .ss-drawer-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                /* FILTER SECTIONS */
                .ss-filter-section {
                    margin-bottom: 2rem;
                }
                .ss-filter-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 0.75rem;
                    margin-top: 0;
                }

                /* SORT OPTIONS */
                .ss-sort-options {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .ss-sort-chip {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    border: 1.5px solid #f1f5f9;
                    background: #fafafa;
                    color: #475569;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }
                .ss-sort-chip:hover {
                    border-color: #e2d5ca;
                    background: #fef8f4;
                }
                .ss-sort-chip.active {
                    border-color: #8c5a3c;
                    background: #fef8f4;
                    color: #8c5a3c;
                    box-shadow: 0 2px 8px rgba(140, 90, 60, 0.1);
                }

                /* PRICE INPUTS */
                .ss-price-inputs {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                }
                .ss-price-field {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    border: 1.5px solid #f1f5f9;
                    border-radius: 10px;
                    padding: 0 0.75rem;
                    background: #fafafa;
                    transition: border-color 0.2s;
                }
                .ss-price-field:focus-within {
                    border-color: #8c5a3c;
                    background: #fff;
                }
                .ss-price-prefix {
                    color: #94a3b8;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-right: 0.25rem;
                }
                .ss-price-field input {
                    border: none;
                    background: transparent;
                    padding: 0.65rem 0;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #1e293b;
                    width: 100%;
                    outline: none;
                    box-shadow: none;
                }
                .ss-price-field input::placeholder {
                    color: #cbd5e1;
                }
                .ss-price-dash {
                    color: #cbd5e1;
                    font-weight: 600;
                }

                /* PRICE PRESETS */
                .ss-price-presets {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .ss-preset-chip {
                    padding: 0.4rem 0.85rem;
                    border-radius: 20px;
                    border: 1.5px solid #f1f5f9;
                    background: #fafafa;
                    color: #64748b;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                .ss-preset-chip:hover {
                    border-color: #e2d5ca;
                    background: #fef8f4;
                    color: #8c5a3c;
                }
                .ss-preset-chip.active {
                    border-color: #8c5a3c;
                    background: #8c5a3c;
                    color: white;
                }

                /* DRAWER FOOTER */
                .ss-drawer-footer {
                    padding: 1.25rem 1.5rem;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    gap: 0.75rem;
                }
                .ss-clear-btn {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    background: #fff;
                    color: #64748b;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .ss-clear-btn:hover {
                    border-color: #cbd5e1;
                    background: #f8fafc;
                }
                .ss-apply-btn {
                    flex: 2;
                    padding: 0.75rem;
                    border-radius: 12px;
                    border: none;
                    background: #8c5a3c;
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(140, 90, 60, 0.2);
                }
                .ss-apply-btn:hover {
                    background: #7a4e34;
                    box-shadow: 0 6px 16px rgba(140, 90, 60, 0.3);
                }
            `}</style>
        </div>
    );
};

export default StoreCategoryView;
