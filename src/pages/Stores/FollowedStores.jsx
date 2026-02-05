import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { Store, MapPin, ArrowRight, Heart } from 'lucide-react';

const FollowedStores = () => {
    const { user } = useAuth();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchFollowedStores();
        }
    }, [user]);

    const fetchFollowedStores = async () => {
        try {
            // Fetch store_follows joined with stores
            // Note: This assumes the relationship is set up or we fetch manually
            const { data, error } = await withTimeout(supabase
                .from('store_follows')
                .select(`
                    store_id,
                    stores:store_id (*)
                `)
                .eq('user_id', user.id));

            if (error) throw error;

            // Map the nested data structure back to a flat store array
            const followedStores = data.map(item => item.stores);
            setStores(followedStores || []);
        } catch (error) {
            console.error('Error fetching followed stores:', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="followed-stores-page">
            <Navbar />
            <div className="container" style={{ paddingTop: '2rem' }}>
                <header className="page-header">
                    <h1><Heart size={32} fill="var(--secondary)" color="var(--secondary)" /> Followed Stores</h1>
                    <p>Your curated list of favorite local shops.</p>
                </header>

                {loading ? (
                    <div className="loader-container relative-loader">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <div className="stores-grid">
                        {stores.length === 0 ? (
                            <div className="empty-state glass-card">
                                <Store size={48} />
                                <h3>You haven't followed any stores yet.</h3>
                                <p>Explore our marketplace to find stores you love.</p>
                                <Link to="/stores" className="btn-primary" style={{ marginTop: '1rem' }}>
                                    Explore Stores
                                </Link>
                            </div>
                        ) : (
                            stores.map(store => (
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
            </div>

            <style>{`
                .followed-stores-page { min-height: 100vh; background: var(--background); padding-bottom: 5rem; }
                .page-header { text-align: center; margin-bottom: 3rem; }
                .page-header h1 { display: flex; align-items: center; justify-content: center; gap: 1rem; font-size: 2.5rem; font-weight: 800; color: var(--text-main); }
                .page-header p { color: var(--text-muted); font-size: 1.2rem; margin-top: 0.5rem; }

                .stores-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
                
                .store-card { display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; transition: var(--transition); height: 100%; border: 1px solid white; }
                .store-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
                
                .store-banner { height: 140px; position: relative; background: var(--border); }
                .store-banner img { width: 100%; height: 100%; object-fit: cover; }
                .banner-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); }
                
                .store-avatar { position: absolute; bottom: -25px; left: 20px; width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 3px solid white; box-shadow: var(--shadow-md); color: var(--text-main); font-size: 1.2rem; }
                
                .store-info { padding: 35px 20px 20px; flex: 1; display: flex; flex-direction: column; }
                .store-info h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
                .description { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                
                .store-meta { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
                .location { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: var(--text-muted); }
                
                .visit-btn { margin-top: auto; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--text-main); color: white; padding: 0.75rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; transition: var(--transition); }
                .visit-btn:hover { background: black; transform: translateY(-2px); }

                .relative-loader { position: static; height: 50vh; background: transparent; }
                .empty-state { text-align: center; padding: 4rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-muted); }
            `}</style>
        </div>
    );
};

export default FollowedStores;
