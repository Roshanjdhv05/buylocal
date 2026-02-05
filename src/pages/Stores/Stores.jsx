import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import Navbar from '../../components/Navbar';
import { Search, MapPin, Store, ArrowRight, Loader } from 'lucide-react';

const Stores = () => {
    const [stores, setStores] = useState([]);
    const [filteredStores, setFilteredStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        const filtered = stores.filter(store =>
            store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredStores(filtered);
    }, [searchQuery, stores]);

    const fetchStores = async () => {
        try {
            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .order('name');

            if (error) throw error;
            setStores(data || []);
            setFilteredStores(data || []);
        } catch (error) {
            console.error('Error fetching stores:', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="stores-page">
            <Navbar />

            <main className="container">
                <header className="stores-hero">
                    <h1>Discover Our Stores</h1>
                    <p>Explore a curated collection of unique stores and find your next favorite fashion piece.</p>
                </header>

                <div className="search-section">
                    <div className="search-bar-wrapper glass-card">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search for a store..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loader-container">
                        <Loader className="spinner" size={40} />
                    </div>
                ) : (
                    <div className="stores-grid">
                        {filteredStores.length === 0 ? (
                            <div className="empty-state glass-card">
                                <Store size={48} />
                                <h3>No stores found</h3>
                                <p>Try adjusting your search criteria</p>
                            </div>
                        ) : (
                            filteredStores.map(store => (
                                <div key={store.id} className="store-card glass-card">
                                    <div className="store-banner">
                                        {store.banner_url ? (
                                            <img src={store.banner_url} alt={store.name} />
                                        ) : (
                                            <div className="banner-placeholder"></div>
                                        )}
                                        <div className="store-avatar">
                                            {store.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="store-info">
                                        <h3>{store.name}</h3>
                                        <p className="description">{store.description}</p>

                                        <div className="store-meta">
                                            <span className="location">
                                                <MapPin size={14} />
                                                {store.city}, {store.state}
                                            </span>
                                        </div>

                                        <Link to={`/store/${store.id}`} className="visit-btn">
                                            Visit Store <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            <style>{`
                .stores-page {
                    min-height: 100vh;
                    background: var(--bg-main);
                    padding-bottom: 5rem;
                }

                .stores-hero {
                    text-align: center;
                    padding: 4rem 1rem 3rem;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .stores-hero h1 {
                    font-size: 3rem;
                    font-weight: 800;
                    color: var(--text-main);
                    margin-bottom: 1rem;
                }

                .stores-hero p {
                    color: var(--text-muted);
                    font-size: 1.2rem;
                    line-height: 1.6;
                }

                .search-section {
                    max-width: 700px;
                    margin: 0 auto 4rem;
                    padding: 0 1rem;
                }

                .search-bar-wrapper {
                    display: flex;
                    align-items: center;
                    padding: 0.5rem 1.5rem;
                    border-radius: 12px;
                    background: #ffff00; /* Matching the bright yellow in screenshot */
                    border: none;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                .search-bar-wrapper input {
                    flex: 1;
                    padding: 1rem;
                    background: transparent;
                    border: none;
                    font-size: 1.1rem;
                    font-weight: 500;
                    color: #000;
                    outline: none;
                }

                .search-bar-wrapper input::placeholder {
                    color: rgba(0,0,0,0.5);
                }

                .search-icon {
                    color: rgba(0,0,0,0.5);
                }

                .stores-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 2rem;
                    padding: 0 1rem;
                }

                .store-card {
                    display: flex;
                    flex-direction: column;
                    border-radius: 16px;
                    overflow: hidden;
                    transition: var(--transition);
                    height: 100%;
                }

                .store-card:hover {
                    transform: translateY(-5px);
                }

                .store-banner {
                    height: 160px;
                    position: relative;
                    background: var(--border);
                }

                .store-banner img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .banner-placeholder {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                    opacity: 0.1;
                }

                .store-avatar {
                    position: absolute;
                    bottom: -30px;
                    left: 20px;
                    width: 70px;
                    height: 70px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-main);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    border: 4px solid white;
                }

                .store-info {
                    padding: 45px 20px 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .store-info h3 {
                    font-size: 1.4rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }

                .description {
                    color: var(--text-muted);
                    font-size: 0.95rem;
                    line-height: 1.5;
                    margin-bottom: 1.5rem;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    flex: 1;
                }

                .store-meta {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .location {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }

                .visit-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    background: #00966b; /* Matching the green in screenshot */
                    color: white;
                    padding: 0.8rem;
                    border-radius: 8px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: var(--transition);
                }

                .visit-btn:hover {
                    background: #007d59;
                    transform: scale(1.02);
                }

                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 5rem;
                    color: var(--text-muted);
                }

                .spinner {
                    animation: spin 1s linear infinite;
                    color: var(--primary);
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .stores-hero h1 { font-size: 2.2rem; }
                    .stores-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default Stores;
