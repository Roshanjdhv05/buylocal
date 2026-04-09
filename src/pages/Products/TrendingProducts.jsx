import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import { useLocation as useLocationContext } from '../../context/LocationContext';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { SlidersHorizontal, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrendingProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const { location } = useLocationContext();
    const navigate = useNavigate();

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
        const fetchTrending = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, store:store_id (name, location, city)')
                    // Sort by newest products, since actual views metrics are missing from the DB
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Format the products to match what ProductCard expects (flatten storeName)
                const formattedProducts = (data || []).map(p => ({
                    ...p,
                    storeName: p.store ? p.store.name : 'Unknown Store'
                }));

                setProducts(formattedProducts);
            } catch (err) {
                console.error("Error fetching trending products:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrending();
    }, [location]);

    const openFilter = () => {
        setTempSortOrder(sortOrder);
        setTempMinPrice(minPrice);
        setTempMaxPrice(maxPrice);
        setIsFilterOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeFilter = () => {
        setIsFilterOpen(false);
        document.body.style.overflow = '';
    };

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

    const clearFilters = () => {
        setTempSortOrder('none');
        setTempMinPrice('');
        setTempMaxPrice('');
    };

    // Apply filtering and sorting
    let filteredProducts = [...products];
    if (minPrice) {
        filteredProducts = filteredProducts.filter(p => (p.online_price || p.price || 0) >= Number(minPrice));
    }
    if (maxPrice) {
        filteredProducts = filteredProducts.filter(p => (p.online_price || p.price || 0) <= Number(maxPrice));
    }

    if (sortOrder === 'asc') {
        filteredProducts.sort((a, b) => (a.online_price || a.price || 0) - (b.online_price || b.price || 0));
    } else if (sortOrder === 'desc') {
        filteredProducts.sort((a, b) => (b.online_price || b.price || 0) - (a.online_price || a.price || 0));
    }

    return (
        <div className="trending-page">
            <Navbar />

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
                <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button onClick={() => navigate(-1)} style={{
                            width: '40px', height: '40px', borderRadius: '50%', background: '#fff',
                            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569'
                        }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>{t('home.trendingTitle')}</h1>
                            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{t('home.trendingSubtitle')}</p>
                        </div>
                    </div>
                </div>

                {!loading && (
                    <div className="controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>
                            SHOWING {filteredProducts.length} OF {products.length} ITEMS
                        </span>
                        <button className="ss-filter-btn" onClick={openFilter}>
                            <SlidersHorizontal size={16} />
                            <span>Filter</span>
                            {activeFilterCount > 0 && (
                                <span className="ss-filter-badge">{activeFilterCount}</span>
                            )}
                        </button>
                    </div>
                )}

                {/* Active filter tags */}
                {activeFilterCount > 0 && (
                    <div className="ss-active-filters">
                        {sortOrder !== 'none' && (
                            <span className="ss-filter-tag">
                                {sortOrder === 'asc' ? '↑ Price: Low to High' : '↓ Price: High to Low'}
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

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="products-grid">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0' }}>
                                <p style={{ color: 'var(--text-muted)' }}>{activeFilterCount > 0 ? t('home.noMatches', 'No products match your filters') : t('home.noTrending')}</p>
                                {activeFilterCount > 0 && (
                                    <button onClick={() => { setSortOrder('none'); setMinPrice(''); setMaxPrice(''); setActiveFilterCount(0); }}
                                        style={{ marginTop: '1rem', background: '#000', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

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
                                    <span style={{ color: '#cbd5e1' }}>–</span>
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

                        <div className="ss-drawer-footer">
                            <button className="ss-clear-btn" onClick={clearFilters}>Clear All</button>
                            <button className="ss-apply-btn" onClick={applyFilters}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .trending-page { background: #fafafa; min-height: 100vh; }
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                }
                @media (min-width: 641px) {
                    .products-grid {
                        grid-template-columns: repeat(4, 1fr);
                        gap: 0.75rem;
                    }
                }
                @media (min-width: 1024px) {
                    .products-grid {
                        grid-template-columns: repeat(7, 1fr);
                    }
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
                    position: relative;
                }
                .ss-filter-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #000;
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
                    margin-bottom: 1.5rem;
                }
                .ss-filter-tag {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 8px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    color: #475569;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .ss-filter-tag svg { cursor: pointer; opacity: 0.6; }

                /* FILTER OVERLAY & DRAWER */
                .ss-filter-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(4px);
                    display: flex;
                    justify-content: flex-end;
                }
                .ss-filter-drawer {
                    width: 340px;
                    max-width: 85vw;
                    height: 100%;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                }
                .ss-drawer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                }
                .ss-drawer-header h3 { margin: 0; font-size: 1.1rem; font-weight: 800; }
                .ss-drawer-close {
                    width: 36px; height: 36px; border-radius: 50%;
                    background: #f8fafc; border: none; display: flex;
                    align-items: center; justify-content: center; color: #64748b; cursor: pointer;
                }
                .ss-drawer-body { flex: 1; overflow-y: auto; padding: 1.5rem; }
                .ss-filter-section { margin-bottom: 2rem; }
                .ss-filter-label {
                    font-size: 0.75rem; font-weight: 700; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem;
                }
                .ss-sort-options { display: flex; flex-direction: column; gap: 0.5rem; }
                .ss-sort-chip {
                    padding: 0.75rem 1rem; border-radius: 10px; border: 1.5px solid #f1f5f9;
                    background: #fafafa; color: #475569; font-size: 0.85rem; font-weight: 600;
                    cursor: pointer; text-align: left;
                }
                .ss-sort-chip.active { border-color: #000; background: #f8fafc; color: #000; }
                
                .ss-price-inputs { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
                .ss-price-field {
                    flex: 1; display: flex; alignItems: center;
                    border: 1.5px solid #f1f5f9; border-radius: 10px;
                    padding: 0 0.75rem; background: #fafafa;
                }
                .ss-price-prefix { color: #94a3b8; font-weight: 600; font-size: 0.9rem; margin-right: 0.25rem; }
                .ss-price-field input { border: none; background: transparent; padding: 0.65rem 0; width: 100%; outline: none; }
                
                .ss-price-presets { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .ss-preset-chip {
                    padding: 0.4rem 0.85rem; border-radius: 20px;
                    border: 1.5px solid #f1f5f9; background: #fafafa;
                    color: #64748b; font-size: 0.75rem; font-weight: 600; cursor: pointer;
                }
                .ss-preset-chip.active { background: #000; color: #fff; border-color: #000; }

                .ss-drawer-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; gap: 0.75rem; }
                .ss-clear-btn {
                    flex: 1; padding: 0.75rem; border-radius: 12px;
                    border: 1.5px solid #e2e8f0; background: #fff;
                    color: #64748b; font-weight: 700; cursor: pointer;
                }
                .ss-apply-btn {
                    flex: 2; padding: 0.75rem; border-radius: 12px;
                    border: none; background: #000; color: #fff;
                    font-weight: 700; cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default TrendingProducts;
