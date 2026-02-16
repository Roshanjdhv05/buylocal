import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, X, Clock, Trash2 } from 'lucide-react';
import { getRecentSearches, addRecentSearch, clearSearchHistory } from '../../utils/searchHistory';
import { getRecentlyViewed } from '../../utils/recentlyViewed';
import { supabase } from '../../services/supabase';

const Search = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        setRecentSearches(getRecentSearches());
        loadRecentProducts();
        // Auto-focus input
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const loadRecentProducts = async () => {
        const recentIds = getRecentlyViewed().slice(0, 10); // Top 10 recent products
        if (recentIds.length === 0) return;

        const { data } = await supabase
            .from('products')
            .select('*, stores(name)')
            .in('id', recentIds.map(p => p.id));

        if (data) {
            // Map store name and keep order if possible (simple implementation)
            const formatted = data.map(p => ({
                ...p,
                storeName: p.stores?.name,
                distance: Infinity // Context not available here easily, defaulted
            }));
            setRecentProducts(formatted);
        }
    };

    const handleSearch = (searchQuery) => {
        const term = searchQuery || query;
        if (term.trim()) {
            addRecentSearch(term.trim());
            navigate(`/?search=${encodeURIComponent(term.trim())}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const clearHistory = () => {
        clearSearchHistory();
        setRecentSearches([]);
    };

    return (
        <div className="search-page">
            <div className="search-header">
                <button onClick={() => navigate(-1)} className="icon-btn back-btn">
                    <ArrowLeft size={24} />
                </button>
                <div className="search-input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for anything..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="clear-btn">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="search-content">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                    <div className="section">
                        <div className="section-title">
                            <h3>Recent Searches</h3>
                            <button onClick={clearHistory} className="clear-history-btn">
                                <Trash2 size={14} /> Clear
                            </button>
                        </div>
                        <div className="recent-searches-list">
                            {recentSearches.map((term, index) => (
                                <div key={index} className="recent-search-item" onClick={() => handleSearch(term)}>
                                    <Clock size={16} className="clock-icon" />
                                    <span>{term}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recently Viewed Products */}
                {recentProducts.length > 0 && (
                    <div className="section">
                        <div className="section-title">
                            <h3>Recently Viewed</h3>
                        </div>
                        <div className="products-scroll">
                            {recentProducts.map(product => (
                                <Link key={product.id} to={`/product/${product.id}`} className="mini-product-link">
                                    <div className="mini-product-img-wrapper">
                                        <img
                                            src={product.images?.[0] || product.image}
                                            alt={product.name}
                                            className="mini-product-img"
                                        />
                                    </div>
                                    <p className="mini-product-name">{product.name}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .search-page {
                    min-height: 100vh;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                }
                .search-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid var(--border);
                    position: sticky;
                    top: 0;
                    background: white;
                    z-index: 10;
                }
                .back-btn { padding: 0.25rem; }
                .search-input-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    background: #f1f5f9;
                    border-radius: 8px;
                    padding: 0.6rem 0.75rem;
                    gap: 0.5rem;
                }
                .search-input-wrapper input {
                    border: none;
                    background: transparent;
                    padding: 0;
                    font-size: 1rem;
                    width: 100%;
                    outline: none;
                }
                .icon-btn { background: none; padding: 0; }
                .clear-btn {
                    background: #cbd5e1;
                    border-radius: 50%;
                    padding: 2px;
                    display: flex;
                    color: white;
                }

                .search-content {
                    padding: 1rem;
                    flex: 1;
                    overflow-y: auto;
                }
                .section { margin-bottom: 2rem; }
                .section-title {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .section-title h3 {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .clear-history-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: var(--error);
                    font-size: 0.85rem;
                    background: none;
                }

                .recent-searches-list {
                    display: flex;
                    flex-direction: column;
                }
                .recent-search-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.85rem 0;
                    border-bottom: 1px solid #f1f5f9;
                    cursor: pointer;
                    color: var(--text-main);
                    font-size: 1rem;
                }
                .recent-search-item:active { background: #f8fafc; }
                .clock-icon { color: #94a3b8; }

                .products-scroll {
                    display: flex;
                    overflow-x: auto;
                    gap: 0.75rem;
                    padding-bottom: 1rem;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .products-scroll::-webkit-scrollbar { display: none; }
                
                .mini-product-link {
                    min-width: 100px;
                    max-width: 100px;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    text-decoration: none;
                }
                .mini-product-img-wrapper {
                    width: 100px;
                    height: 100px;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #f1f5f9;
                    border: 1px solid var(--border);
                }
                .mini-product-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .mini-product-name {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: var(--text-main);
                    text-align: center;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default Search;
