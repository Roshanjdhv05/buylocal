import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Users, Store, Package, ShoppingBag, IndianRupee, LogOut, TrendingUp, Search, ChevronLeft } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalStores: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0
    });
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // Fetch users count
            const { count: userCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // Fetch stores data
            const { data: storesData, error: storesError } = await supabase
                .from('stores')
                .select(`
                    id, 
                    name, 
                    city,
                    owner_id,
                    created_at
                `);

            if (storesError) throw storesError;

            // Fetch products for stats
            const { count: productCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            // Fetch orders for stats and revenue
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('total_amount, store_id');

            if (ordersError) throw ordersError;

            // Fetch products count per store
            const { data: productsData } = await supabase
                .from('products')
                .select('store_id');

            const storeStats = storesData.map(store => {
                const storeOrders = ordersData.filter(o => o.store_id === store.id);
                const storeProducts = productsData.filter(p => p.store_id === store.id);
                const storeRevenue = storeOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

                return {
                    ...store,
                    totalProducts: storeProducts.length,
                    totalOrders: storeOrders.length,
                    totalRevenue: storeRevenue
                };
            });

            const totalRev = ordersData.reduce((sum, o) => sum + Number(o.total_amount), 0);

            setStats({
                totalUsers: userCount || 0,
                totalStores: storesData.length,
                totalProducts: productCount || 0,
                totalOrders: ordersData.length,
                totalRevenue: totalRev
            });

            setStores(storeStats);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loader"></div>
                <p>Loading overview...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <h2>BuyLocal</h2>
                    <span>Admin Panel</span>
                </div>
                <nav className="admin-nav">
                    <div className="nav-item active">
                        <TrendingUp size={20} />
                        <span>Overview</span>
                    </div>
                </nav>
                <button className="admin-logout-btn" onClick={onLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1>{selectedStore ? `Store Details: ${selectedStore.name}` : 'Dashboard Overview'}</h1>
                    {!selectedStore && (
                        <div className="admin-search">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search stores..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    {selectedStore && (
                        <button className="back-btn" onClick={() => setSelectedStore(null)}>
                            <ChevronLeft size={18} /> Back to Overview
                        </button>
                    )}
                </header>

                {selectedStore ? (
                    <div className="store-details-view">
                        <div className="admin-stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon products"><Package size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Products</p>
                                    <h3>{selectedStore.totalProducts}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon orders"><ShoppingBag size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Orders</p>
                                    <h3>{selectedStore.totalOrders}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon revenue"><IndianRupee size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Revenue</p>
                                    <h3>₹{selectedStore.totalRevenue.toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="admin-section store-info-card">
                            <div className="section-header">
                                <h2>Store Information</h2>
                            </div>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Store Name</label>
                                    <p>{selectedStore.name}</p>
                                </div>
                                <div className="info-item">
                                    <label>Location</label>
                                    <p>{selectedStore.city || 'N/A'}</p>
                                </div>
                                <div className="info-item">
                                    <label>Member Since</label>
                                    <p>{new Date(selectedStore.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="info-item">
                                    <label>Owner ID</label>
                                    <p className="id-text">{selectedStore.owner_id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="admin-stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon users"><Users size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Users</p>
                                    <h3>{stats.totalUsers}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon stores"><Store size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Stores</p>
                                    <h3>{stats.totalStores}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon products"><Package size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Products</p>
                                    <h3>{stats.totalProducts}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon orders"><ShoppingBag size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Orders</p>
                                    <h3>{stats.totalOrders}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon revenue"><IndianRupee size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Revenue</p>
                                    <h3>₹{stats.totalRevenue.toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>

                        <section className="admin-section">
                            <div className="section-header">
                                <h2>Store Performance Details</h2>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Store Name</th>
                                            <th>Location</th>
                                            <th>Products</th>
                                            <th>Orders</th>
                                            <th>Revenue</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStores.map(store => (
                                            <tr key={store.id}>
                                                <td className="font-medium clickable-name" onClick={() => setSelectedStore(store)}>
                                                    {store.name}
                                                </td>
                                                <td>{store.city || 'N/A'}</td>
                                                <td>{store.totalProducts}</td>
                                                <td>{store.totalOrders}</td>
                                                <td className="revenue-cell">₹{store.totalRevenue.toLocaleString()}</td>
                                                <td>
                                                    <span className="status-badge active">Active</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

            </main>
        </div>
    );
};

export default AdminDashboard;
