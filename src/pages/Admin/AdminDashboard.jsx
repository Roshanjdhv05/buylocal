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
    const [activeTab, setActiveTab] = useState('overview');
    const [banners, setBanners] = useState([]);
    const [desktopBanner, setDesktopBanner] = useState(null);
    const [mobileBanner, setMobileBanner] = useState(null);
    const [desktopPreview, setDesktopPreview] = useState(null);
    const [mobilePreview, setMobilePreview] = useState(null);

    useEffect(() => {
        fetchAdminData();
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const { data, error } = await supabase
                .from('banner_campaigns')
                .select('*, stores(name)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setBanners(data || []);
        } catch (error) {
            console.error('Error fetching banners:', error.message);
        }
    };

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

    const handleBannerUpload = async () => {
        if (!desktopBanner) {
            alert('Desktop banner is required.');
            return;
        }

        setUploading(true);
        try {
            // 1. Upload Desktop Banner
            const desktopExt = desktopBanner.name.split('.').pop();
            const desktopName = `admin_desktop_${Math.random()}.${desktopExt}`;
            const desktopPath = `campaigns/admin/${desktopName}`;

            const { error: dUploadError } = await supabase.storage
                .from('store-gallery')
                .upload(desktopPath, desktopBanner);

            if (dUploadError) throw dUploadError;

            const { data: { publicUrl: desktopUrl } } = supabase.storage
                .from('store-gallery')
                .getPublicUrl(desktopPath);

            // 2. Upload Mobile Banner (Optional)
            let mobileUrl = null;
            if (mobileBanner) {
                const mobileExt = mobileBanner.name.split('.').pop();
                const mobileName = `admin_mobile_${Math.random()}.${mobileExt}`;
                const mobilePath = `campaigns/admin/${mobileName}`;

                const { error: mUploadError } = await supabase.storage
                    .from('store-gallery')
                    .upload(mobilePath, mobileBanner);

                if (mUploadError) throw mUploadError;

                const { data: { publicUrl: mUrl } } = supabase.storage
                    .from('store-gallery')
                    .getPublicUrl(mobilePath);
                
                mobileUrl = mUrl;
            }

            // 3. Insert Record
            const { data, error: insertError } = await supabase
                .from('banner_campaigns')
                .insert([{
                    banner_url: desktopUrl,
                    mobile_banner_url: mobileUrl,
                    is_active: true,
                    store_id: null
                }])
                .select();

            if (insertError) throw insertError;

            setBanners([data[0], ...banners]);
            setDesktopBanner(null);
            setMobileBanner(null);
            setDesktopPreview(null);
            setMobilePreview(null);
            alert('Responsive banners uploaded successfully!');
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const toggleBanner = async (banner) => {
        try {
            const { error } = await supabase
                .from('banner_campaigns')
                .update({ is_active: !banner.is_active })
                .eq('id', banner.id);

            if (error) throw error;
            setBanners(banners.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
        } catch (error) {
            alert(error.message);
        }
    };

    const deleteBanner = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;
        try {
            const { error } = await supabase
                .from('banner_campaigns')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setBanners(banners.filter(b => b.id !== id));
        } catch (error) {
            alert(error.message);
        }
    };

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
                    <div 
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('overview'); setSelectedStore(null); }}
                    >
                        <TrendingUp size={20} />
                        <span>Overview</span>
                    </div>
                    <div 
                        className={`nav-item ${activeTab === 'banners' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('banners'); setSelectedStore(null); }}
                    >
                        <ShoppingBag size={20} />
                        <span>Banners</span>
                    </div>
                </nav>
                <button className="admin-logout-btn" onClick={onLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1>
                        {selectedStore 
                            ? `Store Details: ${selectedStore.name}` 
                            : activeTab === 'overview' 
                                ? 'Dashboard Overview' 
                                : 'Banner Management'
                        }
                    </h1>
                    {!selectedStore && activeTab === 'overview' && (
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
                    {(selectedStore || activeTab !== 'overview') && (
                        <button className="back-btn" onClick={() => { setSelectedStore(null); setActiveTab('overview'); }}>
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
                ) : activeTab === 'overview' ? (
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
                ) : (
                    <div className="admin-banners-view">
                        <section className="admin-section banner-upload-card">
                            <div className="section-header">
                                <h2>Post Global Banner</h2>
                                <p>Global banners will be shown on the home page hero section without store redirection.</p>
                            </div>
                            <div className="banner-form-content">
                                <div className="banner-upload-grid">
                                    <div className="upload-container">
                                        <h4>Laptop Screen (Desktop)</h4>
                                        <div className="banner-preview-zone">
                                            {desktopPreview ? (
                                                <img src={desktopPreview} alt="Desktop Preview" className="banner-preview-img" />
                                            ) : (
                                                <div className="preview-placeholder">
                                                    <Store size={48} opacity={0.2} />
                                                    <p>Select Desktop Banner</p>
                                                    <span className="dimension-tag">1600 x 600px</span>
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                id="desktop-banner-input" 
                                                hidden 
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if(file) {
                                                        setDesktopBanner(file);
                                                        setDesktopPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                            <label htmlFor="desktop-banner-input" className="btn-select-banner">
                                                {desktopPreview ? 'Change Image' : 'Select Image'}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="upload-container">
                                        <h4>Phone Screen (Mobile)</h4>
                                        <div className="banner-preview-zone">
                                            {mobilePreview ? (
                                                <img src={mobilePreview} alt="Mobile Preview" className="banner-preview-img" />
                                            ) : (
                                                <div className="preview-placeholder">
                                                    <ShoppingBag size={48} opacity={0.2} />
                                                    <p>Select Mobile Banner</p>
                                                    <span className="dimension-tag">800 x 1200px (Vertical)</span>
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                id="mobile-banner-input" 
                                                hidden 
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if(file) {
                                                        setMobileBanner(file);
                                                        setMobilePreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                            <label htmlFor="mobile-banner-input" className="btn-select-banner">
                                                {mobilePreview ? 'Change Image' : 'Select Image'}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {desktopPreview && (
                                    <button 
                                        className="btn-upload-banner" 
                                        onClick={handleBannerUpload}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Uploading...' : 'Publish Responsive Banner'}
                                    </button>
                                )}
                            </div>
                        </section>

                        <section className="admin-section">
                            <div className="section-header">
                                <h2>All Active Hero Banners</h2>
                                <p>Manage both Admin and Seller campaigns from here.</p>
                            </div>
                            <div className="admin-banners-list">
                                {banners.length > 0 ? banners.map(banner => (
                                    <div key={banner.id} className="admin-banner-card">
                                        <div className="banner-card-img">
                                            <img src={banner.banner_url} alt="Banner" />
                                            <div className={`banner-tag ${banner.store_id ? 'seller' : 'admin'}`}>
                                                {banner.store_id ? `SELLER: ${banner.stores?.name}` : 'ADMIN GLOBAL'}
                                            </div>
                                        </div>
                                        <div className="banner-card-footer">
                                            <div className="banner-card-info">
                                                <span className={`status-dot ${banner.is_active ? 'active' : 'inactive'}`}></span>
                                                <span>{banner.is_active ? 'Active' : 'Paused'}</span>
                                            </div>
                                            <div className="banner-card-actions">
                                                <button 
                                                    className={`btn-icon-sm ${banner.is_active ? 'pause' : 'resume'}`}
                                                    onClick={() => toggleBanner(banner)}
                                                    title={banner.is_active ? 'Pause banner' : 'Resume banner'}
                                                >
                                                    {banner.is_active ? '⏸' : '▶'}
                                                </button>
                                                <button 
                                                    className="btn-icon-sm delete"
                                                    onClick={() => deleteBanner(banner.id)}
                                                    title="Delete banner"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-state">No banners found in database.</div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

            </main>
        </div>
    );
};

export default AdminDashboard;
