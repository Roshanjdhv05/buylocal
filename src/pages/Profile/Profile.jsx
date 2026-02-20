import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Bell, BellOff, LogOut, Settings, ChevronRight, Clock, CheckCircle, Truck, Package, Store } from 'lucide-react';
import { requestNotificationPermission } from '../../utils/pushNotification';

const Profile = () => {
    const { user, profile, signOut, upgradeToSeller } = useAuth();
    const navigate = useNavigate();
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');

    const handleToggleNotifications = async () => {
        if (pushEnabled) {
            // Logic to disable (optional, for now just show status)
            alert('To disable notifications, please use your browser settings.');
        } else {
            const success = await requestNotificationPermission(user.id);
            if (success) setPushEnabled(true);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRecentOrders();
        }
    }, [user]);

    const fetchRecentOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, stores(name)')
                .eq('buyer_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) throw error;
            setRecentOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } finally {
            navigate('/login');
        }
    };

    const handleBecomeSeller = async () => {
        if (!user) return;
        setUpgrading(true);
        try {
            await upgradeToSeller();
            alert('Welcome to the seller community! Let\'s create your store.');
            navigate('/seller/create-store');
        } catch (error) {
            alert('Failed to upgrade account: ' + error.message);
        } finally {
            setUpgrading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock size={16} className="text-warning" />;
            case 'accepted': return <Package size={16} className="text-secondary" />;
            case 'dispatched': return <Truck size={16} className="text-primary" />;
            case 'delivered': return <CheckCircle size={16} className="text-success" />;
            default: return <Clock size={16} />;
        }
    };

    if (!user) return null; // Protected route handles redirect, but safe guard

    return (
        <div className="profile-page">
            <Navbar />

            <main className="container profile-container">
                {/* Sidebar / User Card */}
                <aside className="profile-sidebar">
                    <div className="user-card glass-card">
                        <div className="user-avatar">
                            {profile?.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="username">{profile?.username || 'User'}</h2>
                        <p className="user-email">{user.email}</p>

                        {profile?.role === 'seller' && (
                            <span className="seller-badge">Seller Account</span>
                        )}

                        <div className="user-stats">
                            <div className="stat">
                                <span>City</span>
                                <strong>{profile?.city || '-'}</strong>
                            </div>
                            <div className="stat">
                                <span>State</span>
                                <strong>{profile?.state || '-'}</strong>
                            </div>
                        </div>

                        <div className="sidebar-actions">
                            <button
                                className={`action-btn ${pushEnabled ? 'enabled' : ''}`}
                                onClick={handleToggleNotifications}
                                style={{ marginBottom: '0.5rem', color: pushEnabled ? 'var(--success)' : 'var(--text-muted)' }}
                            >
                                {pushEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                                {pushEnabled ? 'Notifications On' : 'Enable Notifications'}
                            </button>
                            <button className="action-btn logout" onClick={handleLogout}>
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="profile-content">

                    {/* Seller Dashboard Promo */}
                    {profile?.role === 'seller' ? (
                        <div className="seller-dashboard-card glass-card">
                            <div className="sd-content">
                                <h3><Store size={24} /> Seller Dashboard</h3>
                                <p>Manage your store, products, and orders.</p>
                            </div>
                            <Link to="/seller/dashboard" className="btn-primary">
                                Go to Dashboard <ChevronRight size={18} />
                            </Link>
                        </div>
                    ) : (
                        <div className="seller-promo-card glass-card">
                            <div className="sd-content">
                                <h3>Become a Seller</h3>
                                <p>Start selling your products to local customers today.</p>
                            </div>
                            <button
                                onClick={handleBecomeSeller}
                                className="btn-secondary-outline"
                                disabled={upgrading}
                            >
                                {upgrading ? 'Upgrading...' : 'Join Now'}
                            </button>
                        </div>
                    )}

                    {/* Recent Orders */}
                    <section className="orders-section glass-card">
                        <div className="section-header">
                            <h3><Package size={20} /> Recent Orders</h3>
                            <Link to="/orders" className="view-all-link">View All</Link>
                        </div>

                        {loading ? (
                            <div className="loading-state">Loading orders...</div>
                        ) : recentOrders.length > 0 ? (
                            <div className="orders-list">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="order-item">
                                        <div className="order-info">
                                            <h4>{order.stores?.name || 'Store'}</h4>
                                            <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                                            <div className="order-status warning">
                                                {getStatusIcon(order.status)} {order.status}
                                            </div>
                                        </div>
                                        <div className="order-total">
                                            <span>Total</span>
                                            <strong>₹{order.total_amount}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No orders yet. Start shopping!</p>
                                <Link to="/" className="btn-text">Browse Products</Link>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <Footer />

            <style>{`
                .profile-page { background: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; }
                .profile-container {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    gap: 2rem;
                    padding-top: 2rem;
                    padding-bottom: 4rem;
                    flex: 1;
                }

                /* User Card */
                .user-card {
                    padding: 2rem;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: sticky;
                    top: 100px;
                }
                .user-avatar {
                    width: 80px;
                    height: 80px;
                    background: var(--grad-main);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    box-shadow: var(--shadow-md);
                }
                .username { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
                .user-email { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem; }
                
                .seller-badge {
                    background: #f0fdf4; color: #16a34a;
                    padding: 0.25rem 0.75rem; border-radius: 50px;
                    font-size: 0.75rem; font-weight: 600;
                    margin-bottom: 1.5rem; border: 1px solid #bbf7d0;
                }

                .user-stats {
                    display: flex;
                    justify-content: space-around;
                    width: 100%;
                    margin-bottom: 2rem;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid var(--border);
                }
                .stat { display: flex; flex-direction: column; gap: 0.25rem; }
                .stat span { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
                .stat strong { font-size: 1rem; color: var(--text-main); }

                .sidebar-actions { width: 100%; }
                .action-btn {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: var(--radius-md);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: var(--transition);
                    background: transparent;
                }
                .action-btn.logout { color: var(--error); border: 1px solid transparent; }
                .action-btn.logout:hover { background: #fef2f2; border-color: #fecaca; }

                /* Main Content Sections */
                .profile-content { display: flex; flex-direction: column; gap: 2rem; }

                .seller-dashboard-card, .seller-promo-card {
                    padding: 1.5rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                }
                .seller-dashboard-card { border-left: 4px solid var(--primary); }
                .sd-content h3 { display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; margin-bottom: 0.25rem; }
                .sd-content p { color: var(--text-muted); }
                
                .btn-secondary-outline {
                    border: 2px solid var(--secondary);
                    color: var(--secondary);
                    padding: 0.5rem 1.5rem;
                    border-radius: var(--radius-md);
                    font-weight: 600;
                    transition: var(--transition);
                }
                .btn-secondary-outline:hover { background: var(--secondary); color: white; }

                /* Orders Section */
                .orders-section { padding: 0; overflow: hidden; background: white; }
                .section-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .section-header h3 { display: flex; align-items: center; gap: 0.75rem; font-size: 1.1rem; }
                .view-all-link { color: var(--primary); font-weight: 600; font-size: 0.9rem; }

                .orders-list { display: flex; flex-direction: column; }
                .order-item {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: var(--transition);
                }
                .order-item:last-child { border-bottom: none; }
                .order-item:hover { background: #f8fafc; }

                .order-info h4 { font-size: 1rem; margin-bottom: 0.25rem; }
                .order-date { font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem; }
                .order-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    background: #f1f5f9;
                    color: var(--text-muted);
                }

                .order-total { text-align: right; }
                .order-total span { display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
                .order-total strong { font-size: 1.1rem; color: var(--primary); }

                .empty-state, .loading-state { padding: 3rem; text-align: center; color: var(--text-muted); }
                .btn-text { color: var(--primary); font-weight: 600; margin-top: 0.5rem; display: inline-block; }

                @media (max-width: 900px) {
                    .profile-container { grid-template-columns: 1fr; }
                    .user-card { position: static; }
                }

                @media (max-width: 480px) {
                    .profile-container { padding-top: 1rem; padding-bottom: 2rem; gap: 1rem; }
                    
                    /* User Card Compact */
                    .user-card { padding: 1.25rem 1rem; margin-bottom: 1rem; }
                    .user-avatar { width: 64px; height: 64px; font-size: 1.5rem; margin-bottom: 0.5rem; }
                    .username { font-size: 1.25rem; margin-bottom: 0.1rem; }
                    .user-email { font-size: 0.85rem; margin-bottom: 0.75rem; }
                    .seller-badge { margin-bottom: 1rem; font-size: 0.7rem; padding: 0.2rem 0.6rem; }
                    
                    .user-stats { margin-bottom: 1.25rem; padding-bottom: 1.25rem; }
                    .stat span { font-size: 0.65rem; }
                    .stat strong { font-size: 0.9rem; }
                    
                    .action-btn { padding: 0.6rem; font-size: 0.9rem; }

                    /* Dashboard/Promo Card Compact */
                    .seller-dashboard-card, .seller-promo-card { 
                        padding: 1rem; 
                        flex-direction: column; 
                        align-items: flex-start; 
                        gap: 1rem;
                    }
                    .seller-dashboard-card { border-left-width: 3px; }
                    .sd-content h3 { font-size: 1.1rem; }
                    .sd-content p { font-size: 0.85rem; }
                    .btn-primary, .btn-secondary-outline { width: 100%; text-align: center; justify-content: center; }

                    /* Orders Compact */
                    .section-header { padding: 1rem; }
                    .section-header h3 { font-size: 1rem; }
                    
                    .order-item { padding: 1rem; flex-direction: column; align-items: flex-start; gap: 0.75rem; }
                    .order-info { width: 100%; }
                    .order-total { width: 100%; display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 0.75rem; text-align: left; }
                    .order-total span { display: inline; margin-right: 0.5rem; }
                }

                .text-warning { color: #f59e0b; }
                .text-secondary { color: var(--secondary); }
                .text-primary { color: var(--primary); }
                .text-success { color: var(--success); }
            `}</style>
        </div>
    );
};

export default Profile;
