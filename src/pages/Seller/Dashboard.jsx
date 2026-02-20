import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import AddProduct from './AddProduct';
import {
    Plus, Edit2, Trash2, Package, ShoppingCart,
    ChevronRight, TrendingUp, AlertCircle, Check,
    Upload, X, Image as ImageIcon, Settings,
    Archive, DollarSign, LogOut, User, Home,
    LayoutDashboard, BarChart, ShoppingBag, PlusCircle, ExternalLink, Edit, Clock, Truck,
    Filter, MoreHorizontal, ChevronLeft, Search, MapPin, Zap, Menu, BookOpen
} from 'lucide-react';
import './DashboardStyles.css';
import InvoiceModal from '../../components/InvoiceModal';

const SellerDashboard = () => {
    const { profile } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isEditingStore, setIsEditingStore] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [bannerUpdating, setBannerUpdating] = useState(false);
    const [editedStore, setEditedStore] = useState({
        name: '', description: '', address: '', phone: '', city: '', state: '',
        delivery_time: '', whatsapp: '', instagram: '',
        legacy_heading: '', legacy_description: '', legacy_image_url: '',
        profile_picture_url: '', location_url: '', gst_number: ''
    });
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
    const [sections, setSections] = useState([]);
    const [legacyImageUploading, setLegacyImageUploading] = useState(false);
    const [profilePictureUploading, setProfilePictureUploading] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    // src/pages/Seller/Dashboard.jsx - REMOVED

    const [newProduct, setNewProduct] = useState({
        name: '',
        category: 'Men',
        section: '', // Added custom section
        online_price: '',
        offline_price: '',
        description: '',
        sizes: [],
        age_group: 'Adults',
        cod_available: true,
        delivery_time: '2-3 days'
    });

    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const [error, setError] = useState(null);

    useEffect(() => {
        if (profile?.id) {
            fetchStoreData();
        } else {
            // If profile is missing after a short delay, we could warn, but AuthContext should handle it.
        }
    }, [profile]);

    const fetchStoreData = async () => {
        console.log('Dashboard: Fetching store data for user:', profile?.id);
        setError(null);
        try {
            const { data: storeData, error: storeError } = await withTimeout(supabase
                .from('stores')
                .select('*')
                .eq('owner_id', profile.id)
                .single());

            if (storeError) {
                console.warn('Dashboard: Store fetch error:', storeError.message);
                if (storeError.code === 'PGRST116') { // PGRST116 = JSON single row not found
                    return navigate('/seller/create-store');
                }
                throw storeError;
            }

            if (!storeData) {
                return navigate('/seller/create-store');
            }

            if (storeData) {
                console.log('Dashboard: Store found:', storeData.name);
                setStore(storeData);

                // Fetch Products
                const { data: productsData, error: productsError } = await withTimeout(supabase
                    .from('products')
                    .select('*')
                    .eq('store_id', storeData.id));

                if (productsError) throw productsError;
                setProducts(productsData || []);

                // Fetch Orders
                const { data: ordersData, error: ordersError } = await withTimeout(supabase
                    .from('orders')
                    .select('*, buyer:users(username, email)')
                    .eq('store_id', storeData.id)
                    .order('created_at', { ascending: false }));

                if (ordersError) throw ordersError;
                setOrders(ordersData || []);

                // Initialize editedStore with fetched data
                setEditedStore({
                    name: storeData.name || '',
                    description: storeData.description || '',
                    address: storeData.address || '',
                    phone: storeData.phone || '',
                    city: storeData.city || '',
                    state: storeData.state || '',
                    delivery_time: storeData.delivery_time || '',
                    whatsapp: storeData.whatsapp || '',
                    instagram: storeData.instagram || '',
                    legacy_heading: storeData.legacy_heading || '',
                    legacy_description: storeData.legacy_description || '',
                    legacy_image_url: storeData.legacy_image_url || '',
                    profile_picture_url: storeData.profile_picture_url || '',
                    location_url: storeData.location_url || '',
                    gst_number: storeData.gst_number || ''
                });

                // Fetch Sections - Non-blocking
                try {
                    const { data: sectionsData, error: sectionsError } = await withTimeout(supabase
                        .from('store_sections')
                        .select('*')
                        .eq('store_id', storeData.id)
                        .order('name'), 5000); // Shorter timeout for non-critical sections

                    if (sectionsError) {
                        console.warn('Dashboard: Sections fetch failed (maybe table missing):', sectionsError.message);
                    } else {
                        setSections(sectionsData || []);
                    }
                } catch (secErr) {
                    console.warn('Dashboard: Sections timed out or failed:', secErr.message);
                }
            }
        } catch (error) {
            console.error('Dashboard: System error:', error.message);
            setError(error.message || 'Failed to load dashboard data');
        } finally {
            console.log('Dashboard: Loading finished');
            setLoading(false);
        }
    };

    const toggleSize = (size) => {
        setNewProduct(prev => ({
            ...prev,
            sizes: prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size]
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setSelectedImages(prev => [...prev, ...files]);
            const previews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...previews]);
        }
    };

    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(imagePreviews[index]);
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImage = async (file) => {
        if (!profile?.id) throw new Error('User profile not loaded');
        console.log('uploadImage: Starting upload for:', file.name);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;
        console.log('uploadImage: Target path:', filePath);

        // Try using 'store-gallery' bucket which we know exists from CreateStore.jsx
        const { error: uploadError } = await withTimeout(supabase.storage
            .from('store-gallery')
            .upload(filePath, file));

        if (uploadError) {
            console.error('uploadImage: Upload error:', uploadError.message, uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from('store-gallery')
            .getPublicUrl(filePath);

        console.log('uploadImage: Successfully uploaded, URL:', publicUrl);
        return publicUrl;
    };

    const handleAddProduct = async (productData = newProduct) => {
        // e?.preventDefault(); // e might not be passed if called from AddProduct component

        if (!store) {
            console.error('handleAddProduct: No store found');
            alert('Error: Store information not loaded correctly.');
            return;
        }

        // Check product limit (50 products)
        if (!productData.id && products.length >= 50) {
            alert('Limit reached: Each store can have a maximum of 50 products.');
            return;
        }

        const onlinePriceVal = productData.online_price || productData.onlinePrice;
        if (!onlinePriceVal) {
            alert('Please enter an online price.');
            return;
        }

        console.log('handleAddProduct: Starting process. Mode:', productData.id ? 'UPDATE' : 'INSERT');
        setUploading(true);

        try {
            // 1. Upload/Process Images
            const imageUrls = [];
            const imagesToUpload = productData.images || [];

            if (imagesToUpload.length > 0) {
                for (const img of imagesToUpload) {
                    if (typeof img === 'string' && img.startsWith('blob:')) {
                        const response = await fetch(img);
                        const blob = await response.blob();
                        const file = new File([blob], "product_image.jpg", { type: "image/jpeg" });
                        const url = await uploadImage(file);
                        imageUrls.push(url);
                    } else if (img instanceof File) {
                        const url = await uploadImage(img);
                        imageUrls.push(url);
                    } else {
                        imageUrls.push(img);
                    }
                }
            }

            // 2. Prepare Product Object
            const onlinePrice = parseFloat(onlinePriceVal);
            const productToSave = {
                name: productData.name,
                category: productData.category,
                section: productData.section,
                online_price: onlinePrice,
                offline_price: productData.offline_price ? parseFloat(productData.offline_price) : (productData.marketPrice ? parseFloat(productData.marketPrice) : null),
                description: productData.description,
                sizes: productData.sizes,
                age_group: productData.age_group || productData.ageGroup || 'Adults',
                cod_available: productData.cod_available ?? productData.codEnabled ?? true,
                delivery_time: productData.delivery_time || productData.deliveryTime || '2-3 days',
                delivery_charges: parseFloat(productData.delivery_charges || productData.deliveryCharges || 0),
                store_id: store.id,
                images: imageUrls
            };

            let result;
            if (productData.id) {
                // UPDATE mode
                result = await supabase
                    .from('products')
                    .update(productToSave)
                    .eq('id', productData.id)
                    .select();
            } else {
                // INSERT mode
                result = await supabase
                    .from('products')
                    .insert([productToSave])
                    .select();
            }

            const { data, error } = result;

            if (error) throw error;

            if (productData.id) {
                setProducts(products.map(p => p.id === productData.id ? data[0] : p));
                alert('Product updated successfully!');
            } else {
                setProducts([...products, data[0]]);
                alert('Product added successfully!');
            }

            setIsAddingProduct(false);
            setEditingProduct(null);
            setNewProduct({
                name: '', category: '', section: '', online_price: '', offline_price: '',
                description: '', sizes: [], age_group: 'Adults',
                cod_available: true, delivery_time: '1-2 days'
            });
            setSelectedImages([]);
            setImagePreviews([]);
        } catch (error) {
            console.error('handleAddProduct: Unexpected error:', error.message);
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            alert(error.message);
        }
    };

    const handleUpdateStore = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const { error } = await supabase
                .from('stores')
                .update(editedStore)
                .eq('id', store.id);

            if (error) throw error;
            setStore({ ...store, ...editedStore });
            setIsEditingStore(false);
            alert('Store updated successfully!');
        } catch (error) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setBannerUpdating(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `banners/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('store-gallery')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('store-gallery')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('stores')
                .update({ banner_url: publicUrl })
                .eq('id', store.id);

            if (updateError) throw updateError;
            setStore({ ...store, banner_url: publicUrl });
            alert('Banner updated successfully!');
        } catch (error) {
            alert(error.message);
        } finally {
            setBannerUpdating(false);
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `gallery/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('store-gallery')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('store-gallery')
                    .getPublicUrl(filePath);

                return publicUrl;
            });

            const newPublicUrls = await Promise.all(uploadPromises);
            const updatedGallery = [...(store.gallery_urls || []), ...newPublicUrls];

            const { error: updateError } = await supabase
                .from('stores')
                .update({ gallery_urls: updatedGallery })
                .eq('id', store.id);

            if (updateError) throw updateError;
            setStore({ ...store, gallery_urls: updatedGallery });
            alert('Gallery updated successfully!');
        } catch (error) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleLegacyImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLegacyImageUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `legacy_${Math.random()}.${fileExt}`;
            const filePath = `legacy/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('store-gallery')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('store-gallery')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('stores')
                .update({ legacy_image_url: publicUrl })
                .eq('id', store.id);

            if (updateError) throw updateError;
            setStore({ ...store, legacy_image_url: publicUrl });
            setEditedStore(prev => ({ ...prev, legacy_image_url: publicUrl }));
            alert('Legacy image updated successfully!');
        } catch (error) {
            alert(error.message);
        } finally {
            setLegacyImageUploading(false);
        }
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setProfilePictureUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `profile_${Math.random()}.${fileExt}`;
            const filePath = `profile/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('store-gallery')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('store-gallery')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('stores')
                .update({ profile_picture_url: publicUrl })
                .eq('id', store.id);

            if (updateError) throw updateError;
            setStore({ ...store, profile_picture_url: publicUrl });
            setEditedStore(prev => ({ ...prev, profile_picture_url: publicUrl }));
            alert('Profile picture updated successfully!');
        } catch (error) {
            alert(error.message);
        } finally {
            setProfilePictureUploading(false);
        }
    };

    const handleDeleteGalleryImage = async (urlToDelete) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;

        try {
            const updatedGallery = store.gallery_urls.filter(url => url !== urlToDelete);

            const { error } = await supabase
                .from('stores')
                .update({ gallery_urls: updatedGallery })
                .eq('id', store.id);

            if (error) throw error;
            setStore({ ...store, gallery_urls: updatedGallery });
        } catch (error) {
            alert(error.message);
        }
    };

    const handleCreateSection = async () => {
        if (!newSectionName.trim() || !store) return;
        try {
            const { data, error } = await supabase
                .from('store_sections')
                .insert([{ store_id: store.id, name: newSectionName.trim() }])
                .select();

            if (error) throw error;

            setSections([...sections, data || []].flat());
            setNewSectionName('');
            alert('Section created successfully!');
        } catch (error) {
            console.error('Error creating section:', error.message);
            alert('Failed to create section. Did you run the SQL query yet?');
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setIsAddingProduct(true);
    };

    const handleProductDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);
            if (error) throw error;
            setProducts(products.filter(p => p.id !== productId));
            alert('Product deleted successfully');
        } catch (error) {
            alert('Error deleting product: ' + error.message);
        }
    };

    const handlePrintInvoice = () => {
        window.print();
    };






    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error.message);
        } else {
            navigate('/login');
        }
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    if (error) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
            <h2>Error Loading Dashboard</h2>
            <p>{error}</p>
            <button onClick={fetchStoreData} className="btn-primary" style={{ marginTop: '1rem' }}>Retry</button>
        </div>
    );

    return (
        <div className="dashboard-wrapper">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="mobile-menu-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
                <div className="sidebar-header-mobile">
                    <Link to="/" className="sidebar-branding">
                        <div className="brand-icon"><ShoppingBag size={20} /></div>
                        <span className="brand-text">BuyLocal</span>
                    </Link>
                    <button className="close-sidebar-btn" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/" className="nav-item">
                        <Home size={18} /> <span>Home</span>
                    </Link>
                    <button onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}>
                        <LayoutDashboard size={18} /> <span>Overview</span>
                    </button>
                    <button onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}>
                        <Package size={18} /> <span>Products</span>
                    </button>
                    <button onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}>
                        <ShoppingCart size={18} /> <span>Orders</span>
                    </button>
                    <button onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
                        <Settings size={18} /> <span>Store Settings</span>
                    </button>
                    <button className="nav-item">
                        <BarChart size={18} /> <span>Analytics</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="pro-card">
                        <div className="pro-label">PLAN: PRO</div>
                        <p className="pro-text">You have 12 days left on your premium trial.</p>
                        <button className="btn-upgrade">Upgrade</button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {isAddingProduct ? (
                    <AddProduct
                        onBack={() => {
                            setIsAddingProduct(false);
                            setEditingProduct(null);
                        }}
                        onAdd={handleAddProduct}
                        uploading={uploading}
                        sections={sections}
                        initialData={editingProduct}
                    />
                ) : (
                    <>
                        {/* Header */}
                        <header className="dashboard-header-new">
                            <div className="header-left-group">
                                <button
                                    className="mobile-menu-btn"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                >
                                    <Menu size={24} />
                                </button>
                                <h1 className="header-title">Seller Dashboard</h1>
                            </div>

                            <div className="header-actions">
                                <div className="store-selector">
                                    <div className="store-avatar"></div>
                                    <span className="store-name">{store?.name || 'Loading...'}</span>
                                    <ChevronRight size={16} style={{ rotate: '90deg' }} />
                                </div>

                                <Link to="/profile" className="user-profile-header" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="user-info-text">
                                        <span className="user-name">{profile?.username || 'User'}</span>
                                    </div>
                                    <div className="user-avatar-small">
                                        {profile?.username ? (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6366f1', color: 'white', fontWeight: 'bold' }}>
                                                {profile.username.charAt(0)}
                                            </div>
                                        ) : (
                                            <img src="https://via.placeholder.com/40" alt="Profile" />
                                        )}
                                    </div>
                                </Link>
                            </div>
                        </header>

                        {/* Dashboard Content Swapper */}
                        {activeTab === 'overview' && (
                            <div className="overview-content">
                                {/* Stats Grid */}
                                <div className="stats-grid-new">
                                    <div className="stat-card-new">
                                        <div className="stat-header">
                                            <span className="stat-title">Total Products</span>
                                            <div className="stat-icon-wrapper bg-purple"><Package size={18} /></div>
                                        </div>
                                        <span className="stat-value">{products.length}</span>
                                        <span className="stat-trend trend-up"><TrendingUp size={12} /> +8% from last month</span>
                                    </div>
                                    <div className="stat-card-new">
                                        <div className="stat-header">
                                            <span className="stat-title">Pending Orders</span>
                                            <div className="stat-icon-wrapper bg-orange"><Clock size={18} /></div>
                                        </div>
                                        <span className="stat-value">{orders.filter(o => o.status === 'pending').length}</span>
                                        <span className="stat-trend trend-down">Requires attention</span>
                                    </div>
                                    <div className="stat-card-new">
                                        <div className="stat-header">
                                            <span className="stat-title">Total Revenue</span>
                                            <div className="stat-icon-wrapper bg-green"><DollarSign size={18} /></div>
                                        </div>
                                        <span className="stat-value">₹{orders.reduce((acc, o) => acc + (o.status === 'delivered' ? o.total_amount : 0), 0).toLocaleString()}</span>
                                        <span className="stat-trend trend-up"><TrendingUp size={12} /> +14.2% vs prev period</span>
                                    </div>
                                    <div className="stat-card-new">
                                        <div className="stat-header">
                                            <span className="stat-title">Avg Delivery Time</span>
                                            <div className="stat-icon-wrapper bg-blue"><Truck size={18} /></div>
                                        </div>
                                        <span className="stat-value">2.4 <span style={{ fontSize: '1rem', color: '#64748b' }}>Days</span></span>
                                        <span className="stat-trend trend-up">0.5d improvement</span>
                                    </div>
                                </div>

                                {/* Recent Orders & Quick Actions */}
                                <div className="overview-layout">
                                    {/* Left: Recent Orders */}
                                    <section className="recent-orders-section">
                                        <div className="section-header-flex">
                                            <h2>Recent Orders</h2>
                                            <Link to="/orders" className="view-all-link">View All Orders</Link>
                                        </div>

                                        <div className="table-responsive">
                                            <table className="orders-table">
                                                <thead>
                                                    <tr>
                                                        <th>ORDER ID</th>
                                                        <th>CUSTOMER</th>
                                                        <th>AMOUNT</th>
                                                        <th>STATUS</th>
                                                        <th>ACTION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.slice(0, 5).map(order => (
                                                        <tr key={order.id}>
                                                            <td className="order-id-cell" data-label="Order ID">
                                                                #{order.display_id || order.id.slice(0, 8).toUpperCase()}
                                                                <span className="order-date-span">{new Date(order.created_at).toLocaleString()}</span>
                                                            </td>
                                                            <td data-label="Customer">{order.buyer?.email?.split('@')[0] || 'Customer'}</td>
                                                            <td className="amount-cell" data-label="Amount">₹{order.total_amount}</td>
                                                            <td data-label="Status">
                                                                <span className={`status-badge-pill status-pill-${order.status}`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td data-label="Action">
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <span className="action-link" onClick={() => setActiveTab('orders')}>View</span>
                                                                    <span className="action-link invoice-link" onClick={() => {
                                                                        setSelectedOrderForInvoice(order);
                                                                        setIsInvoiceModalOpen(true);
                                                                    }}>Invoice</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {orders.length === 0 && (
                                                        <tr>
                                                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No recent orders found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>

                                    {/* Right: Quick Actions */}
                                    <aside className="quick-actions-panel">
                                        <div className="quick-actions-card">
                                            <h3 className="panel-title">Quick Actions</h3>
                                            <div className="action-buttons-stack">
                                                <button
                                                    className={`btn-action-primary ${products.length >= 50 ? 'disabled' : ''}`}
                                                    onClick={() => {
                                                        if (products.length >= 50) {
                                                            alert('Product limit reached (50/50).');
                                                        } else {
                                                            setIsAddingProduct(true);
                                                        }
                                                    }}
                                                    disabled={products.length >= 50}
                                                >
                                                    <PlusCircle size={18} /> Add Product ({products.length}/50)
                                                </button>
                                                <button className="btn-action-white" onClick={() => setActiveTab('settings')}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Edit size={16} /> Edit Store</span>
                                                    <ChevronRight size={16} />
                                                </button>
                                                <Link to={`/store/${store?.id}`} className="btn-action-white" target="_blank">
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ExternalLink size={16} /> View Store Page</span>
                                                    <ChevronRight size={16} />
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="boost-card">
                                            <h3 className="boost-title">Boost Sales!</h3>
                                            <p className="boost-desc">Run a weekend sale campaign to increase your product visibility by up to 40%.</p>
                                            <button className="btn-boost">Create Campaign</button>
                                        </div>
                                    </aside>
                                </div>
                            </div>
                        )}

                        {/* Existing Tabs Content (Preserved) */}
                        {activeTab === 'products' && (
                            <div className="products-tab-pro">
                                {/* Header */}
                                <div className="product-page-header">
                                    <div className="page-title">
                                        <h2>Product Management</h2>
                                        <p>Add, edit, and organize your storefront inventory.</p>
                                    </div>
                                    <button
                                        className={`btn-add-product ${products.length >= 50 ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (products.length >= 50) {
                                                alert('Product limit reached (50/50).');
                                            } else {
                                                setIsAddingProduct(true);
                                            }
                                        }}
                                        disabled={products.length >= 50}
                                    >
                                        <Plus size={20} /> Add Product ({products.length}/50)
                                    </button>
                                </div>

                                {/* Toolbar */}
                                <div className="products-toolbar">
                                    <div className="toolbar-left">
                                        <label className="bulk-item">
                                            <input type="checkbox" className="accent-indigo-500 w-4 h-4" /> <span style={{ marginLeft: '8px' }}>Select All</span>
                                        </label>
                                        <div className="bulk-item">
                                            <Archive size={16} /> Disable Selected
                                        </div>
                                        <div className="bulk-item bulk-action-delete">
                                            <Trash2 size={16} /> Bulk Delete
                                        </div>
                                    </div>
                                    <div className="toolbar-right">
                                        <button className="filter-dropdown-btn">
                                            All Products <ChevronRight size={16} style={{ rotate: '90deg' }} />
                                        </button>
                                        <button className="filter-dropdown-btn">
                                            <Filter size={16} /> Filters
                                        </button>
                                    </div>
                                </div>

                                {/* Pro Grid */}
                                <div className="products-grid-pro">
                                    {products.map(product => (
                                        <div key={product.id} className="product-card-pro">
                                            <input type="checkbox" className="card-selection-check" />
                                            <div className="pro-card-image">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0]} alt={product.name} />
                                                ) : (
                                                    <Package size={48} color="#cbd5e1" />
                                                )}
                                                <div className="pro-card-actions">
                                                    <button className="pro-action-btn edit" onClick={() => handleEditProduct(product)}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="pro-action-btn delete" onClick={() => handleProductDelete(product.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="pro-card-meta">
                                                <span className="category-pill">{product.category || 'General'}</span>
                                                {product.section && (
                                                    <span className="section-pill" style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>
                                                        {product.section}
                                                    </span>
                                                )}
                                                <span className={`status-dot ${(product.stock_quantity || 0) <= 0 ? 'out-of-stock' : ''}`}>
                                                    <span className="dot"></span> {(product.stock_quantity || 12) > 0 ? 'Active' : 'Out of Stock'}
                                                </span>
                                            </div>
                                            <h3 className="pro-card-name" title={product.name}>{product.name}</h3>
                                            <div className="pro-card-footer">
                                                <span className="pro-price">₹{product.online_price}</span>
                                                <span className="pro-stock">{product.stock_quantity || 12} in stock</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="pagination-controls">
                                    <span className="pagination-info-text">
                                        Showing {products.length > 0 ? 1 : 0} to {products.length} of {products.length} products
                                    </span>
                                    <button className="page-btn arrow" disabled><ChevronLeft size={18} /></button>
                                    <button className="page-btn active">1</button>
                                    <button className="page-btn">2</button>
                                    <button className="page-btn">3</button>
                                    <button className="page-btn arrow"><ChevronRight size={18} /></button>
                                </div>

                            </div>
                        )} { /* End of Products Tab */}

                        {activeTab === 'orders' && (
                            <div className="orders-tab-pro">
                                <div className="orders-page-header">
                                    <div className="header-text">
                                        <h2>Manage Orders</h2>
                                        <p style={{ color: 'var(--text-muted)' }}>Process your incoming shipments and update order status for your customers.</p>
                                    </div>
                                    <div className="order-stats-group">
                                        <div className="order-stat-item">
                                            <span className="order-stat-label">Today's New</span>
                                            <span className="order-stat-value">14 Orders</span>
                                        </div>
                                        <div className="order-stat-item">
                                            <span className="order-stat-label">Awaiting Dispatch</span>
                                            <span className="order-stat-value orange">8 Orders</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="orders-toolbar">
                                    <div className="search-wrapper">
                                        <Search size={18} className="search-icon" />
                                        <input placeholder="Search by Order ID or Name..." className="order-search-input" />
                                    </div>
                                    <select className="toolbar-select">
                                        <option>All Statuses</option>
                                        <option>Pending</option>
                                        <option>Dispatched</option>
                                        <option>Delivered</option>
                                    </select>
                                    <select className="toolbar-select">
                                        <option>Last 30 Days</option>
                                        <option>Today</option>
                                        <option>This Week</option>
                                    </select>
                                    <button className="btn-apply-filters">Apply Filters</button>
                                </div>

                                <div className="orders-list-pro">
                                    {orders.map(order => (
                                        <div key={order.id} className="order-card-pro">
                                            <div className="order-pro-header">
                                                <div className="order-id-block">
                                                    <span className="order-status-badge" data-status={order.status}>
                                                        {order.status.toUpperCase()}
                                                    </span>
                                                    <span style={{ margin: '0 0.75rem', color: '#cbd5e1' }}>|</span>
                                                    <span className="order-type-badge">{order.delivery_type || 'Delivery'}</span>
                                                    <span style={{ margin: '0 0.75rem', color: '#cbd5e1' }}>|</span>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ordered {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ago</span>
                                                </div>
                                                <div className="order-pro-id">#{order.id.slice(0, 8).toUpperCase()}</div>
                                            </div>
                                            <div className="order-pro-body">
                                                <div className="customer-info-block">
                                                    <h4>Customer Details</h4>
                                                    <p className="customer-name">{order.buyer?.username || 'Guest User'}</p>
                                                    <p className="customer-loc"><User size={14} /> {order.buyer?.email || 'N/A'}</p>
                                                    <p className="customer-loc">
                                                        <Truck size={14} /> {order.delivery_type === 'Self-pick' ? <strong>Customer will Pick up at Store</strong> : (order.shipping_address ? order.shipping_address.substring(0, 30) + '...' : 'No Address')}
                                                    </p>
                                                    <p className="payment-method-text" style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#6366f1' }}>
                                                        <DollarSign size={14} /> Payment: {order.payment_method || 'COD'}
                                                    </p>
                                                </div>
                                                <div className="order-items-block">
                                                    <h4>Order Items</h4>
                                                    {order.items?.map((item, idx) => (
                                                        <div key={idx} className="pro-item-row">
                                                            <div className="pro-item-img">
                                                                <Package size={24} style={{ margin: '12px', color: '#cbd5e1' }} />
                                                            </div>
                                                            <div className="pro-item-details">
                                                                <p className="pro-item-name">{item.name}</p>
                                                                <p className="pro-item-sub">Qty: {item.quantity || 1} • ₹{item.price}</p>
                                                            </div>
                                                            <div className="pro-item-total" style={{ fontWeight: '700' }}>
                                                                ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="order-pro-actions">
                                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order Total</span>
                                                    <span className="order-total-large">₹{order.total_amount}</span>

                                                    <div className="btn-group-pro" style={{ marginTop: 'auto' }}>
                                                        <button
                                                            className="btn-invoice-pro"
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.75rem',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e2e8f0',
                                                                background: 'white',
                                                                fontWeight: '600',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '0.5rem',
                                                                cursor: 'pointer',
                                                                marginBottom: '0.5rem'
                                                            }}
                                                            onClick={() => {
                                                                setSelectedOrderForInvoice(order);
                                                                setIsInvoiceModalOpen(true);
                                                            }}
                                                        >
                                                            <BookOpen size={16} /> View Invoice
                                                        </button>
                                                        {order.status === 'pending' && (
                                                            <>
                                                                <button className="btn-reject">Reject</button>
                                                                <button className="btn-accept-pro" onClick={() => updateOrderStatus(order.id, 'accepted')}>Accept Order</button>
                                                            </>
                                                        )}
                                                        {order.status === 'accepted' && (
                                                            <button className="btn-accept-pro btn-dispatch-pro" onClick={() => updateOrderStatus(order.id, 'dispatched')}>
                                                                <Truck size={16} style={{ marginRight: '8px' }} /> Dispatch Order
                                                            </button>
                                                        )}
                                                        {order.status === 'dispatched' && (
                                                            <button className="btn-accept-pro btn-delivered-pro" onClick={() => updateOrderStatus(order.id, 'delivered')}>
                                                                <Check size={16} style={{ marginRight: '8px' }} /> Mark Delivered
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="settings-tab-pro">
                                <div className="orders-page-header">
                                    <div className="header-text">
                                        <h2>Store Branding & Visibility</h2>
                                        <p style={{ color: 'var(--text-muted)' }}>Configure how your local shop appears to nearby customers.</p>
                                    </div>
                                    <button className="btn-save-all" onClick={handleUpdateStore}>
                                        <Zap size={18} fill="white" style={{ marginRight: '8px' }} /> Save All Changes
                                    </button>
                                </div>

                                <div className="settings-layout-pro">
                                    {/* Left Column: Profile & Branding */}
                                    <div className="settings-left-col">
                                        <div className="settings-card-pro">
                                            <div class="card-header-pro">
                                                <div class="card-icon"><User size={24} /></div>
                                                <h3>Store Profile</h3>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                                                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                                                    {editedStore.profile_picture_url || store?.profile_picture_url ? (
                                                        <img
                                                            src={editedStore.profile_picture_url || store?.profile_picture_url}
                                                            alt="Profile"
                                                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: '#64748b' }}>
                                                            {store?.name?.charAt(0) || 'S'}
                                                        </div>
                                                    )}
                                                    <label style={{
                                                        position: 'absolute', bottom: '0', right: '0',
                                                        background: 'white', border: '1px solid #e2e8f0',
                                                        borderRadius: '50%', width: '28px', height: '28px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                    }}>
                                                        <ImageIcon size={14} color="#64748b" />
                                                        <input type="file" hidden accept="image/*" onChange={handleProfilePictureUpload} disabled={profilePictureUploading} />
                                                    </label>
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem' }}>Profile Picture</h4>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {profilePictureUploading ? 'Uploading...' : 'Visible on public store page'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="form-row-pro-responsive">
                                                <div className="settings-input-group">
                                                    <label className="settings-label">Store Name</label>
                                                    <input className="settings-input-light light-bg" value={editedStore.name} onChange={e => setEditedStore({ ...editedStore, name: e.target.value })} />
                                                </div>
                                                <div className="settings-input-group light-bg">
                                                    <label className="settings-label">Delivery Days</label>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <input className="settings-input-light" style={{ flex: 1 }} placeholder="e.g. 2-3 days" value={editedStore.delivery_time} onChange={e => setEditedStore({ ...editedStore, delivery_time: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="settings-input-group light-bg">
                                                <label className="settings-label">Physical Address</label>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <input className="settings-input-light" style={{ width: '100%' }} value={editedStore.address} onChange={e => setEditedStore({ ...editedStore, address: e.target.value })} />
                                                    <MapPin size={18} color="#94a3b8" />
                                                </div>
                                            </div>

                                            <div className="form-row-pro-responsive" style={{ marginTop: '1.5rem' }}>
                                                <div className="settings-input-group light-bg">
                                                    <label className="settings-label">WhatsApp Number</label>
                                                    <input className="settings-input-light" placeholder="e.g. +91 9876543210" value={editedStore.whatsapp} onChange={e => setEditedStore({ ...editedStore, whatsapp: e.target.value })} />
                                                </div>
                                                <div className="settings-input-group light-bg">
                                                    <label className="settings-label">Instagram Username</label>
                                                    <input className="settings-input-light" placeholder="e.g. yourshop_handle" value={editedStore.instagram} onChange={e => setEditedStore({ ...editedStore, instagram: e.target.value })} />
                                                </div>
                                                <div className="settings-input-group light-bg">
                                                    <label className="settings-label">GST Number (Optional)</label>
                                                    <input className="settings-input-light" placeholder="e.g. 22AAAAA0000A1Z5" value={editedStore.gst_number} onChange={e => setEditedStore({ ...editedStore, gst_number: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="settings-input-group light-bg" style={{ marginTop: '1.5rem' }}>
                                                <label className="settings-label">Google Maps Location Link</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <MapPin size={18} color="#94a3b8" />
                                                    <input
                                                        className="settings-input-light"
                                                        style={{ flex: 1 }}
                                                        placeholder="Paste your Google Maps link here..."
                                                        value={editedStore.location_url}
                                                        onChange={e => setEditedStore({ ...editedStore, location_url: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="settings-card-pro">
                                            <div className="card-header-pro">
                                                <div className="card-icon"><ImageIcon size={24} /></div>
                                                <h3>Store Banner</h3>
                                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>RECOMMENDED: 1200 x 400PX</span>
                                            </div>
                                            <div className="banner-preview-wrapper" style={{ height: '240px' }}>
                                                {store?.banner_url ? (
                                                    <img src={store?.banner_url} alt="Banner" className="banner-preview-img" />
                                                ) : (
                                                    <div className="banner-missing">
                                                        <ImageIcon size={48} />
                                                        <p>No banner uploaded</p>
                                                    </div>
                                                )}
                                                <label className="banner-upload-overlay">
                                                    {bannerUpdating ? 'Uploading...' : 'Change Banner'}
                                                    <input type="file" hidden accept="image/*" onChange={handleBannerUpload} disabled={bannerUpdating} />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="settings-card-pro">
                                            <div className="card-header-pro">
                                                <div className="card-icon"><LayoutDashboard size={24} /></div>
                                                <h3>Store Gallery</h3>
                                            </div>
                                            <div className="gallery-preview-grid">
                                                {store?.gallery_urls?.map((url, idx) => (
                                                    <div key={idx} className="gallery-item-preview">
                                                        <img src={url} alt={`Gallery ${idx}`} />
                                                        <button className="delete-gallery-img" onClick={() => handleDeleteGalleryImage(url)}><Trash2 size={14} /></button>
                                                    </div>
                                                ))}
                                                <label className="gallery-add-btn" style={{ aspectRatio: '1', border: '2px dashed #c084fc', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7c3aed', fontWeight: '700', fontSize: '0.75rem', gap: '0.5rem', background: '#faf5ff' }}>
                                                    <PlusCircle size={24} fill="#c084fc" color="white" />
                                                    ADD MEDIA
                                                    <input type="file" hidden multiple accept="image/*" onChange={handleGalleryUpload} />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="settings-card-pro">
                                            <div className="card-header-pro">
                                                <div className="card-icon"><BookOpen size={24} /></div>
                                                <h3>Our Legacy & Story</h3>
                                            </div>
                                            <div className="form-row-pro-responsive">
                                                <div className="settings-input-group light-bg" style={{ width: '100%' }}>
                                                    <label className="settings-label">Legacy Heading</label>
                                                    <input
                                                        className="settings-input-light"
                                                        placeholder="e.g. Our Legacy"
                                                        value={editedStore.legacy_heading || store?.legacy_heading || ''}
                                                        onChange={e => setEditedStore({ ...editedStore, legacy_heading: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="settings-input-group light-bg" style={{ marginTop: '1rem' }}>
                                                <label className="settings-label">Legacy Description</label>
                                                <textarea
                                                    className="settings-input-light"
                                                    style={{ minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                                                    placeholder="Tell your store's story... (Shared across your public store page)"
                                                    value={editedStore.legacy_description || store?.legacy_description || ''}
                                                    onChange={e => setEditedStore({ ...editedStore, legacy_description: e.target.value })}
                                                />
                                            </div>
                                            <div className="banner-preview-wrapper" style={{ height: '200px', marginTop: '1.5rem' }}>
                                                {editedStore.legacy_image_url || store?.legacy_image_url ? (
                                                    <img src={editedStore.legacy_image_url || store?.legacy_image_url} alt="Legacy" className="banner-preview-img" style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <div className="banner-missing">
                                                        <ImageIcon size={48} />
                                                        <p>No legacy image uploaded</p>
                                                    </div>
                                                )}
                                                <label className="banner-upload-overlay">
                                                    {legacyImageUploading ? 'Uploading...' : 'Change Image'}
                                                    <input type="file" hidden accept="image/*" onChange={handleLegacyImageUpload} disabled={legacyImageUploading} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Operations & QR */}
                                    <div className="operations-sidebar">
                                        <div className="ops-card">
                                            <div className="ops-header">
                                                <Zap size={20} color="#8b5cf6" style={{ transform: 'rotate(180deg)' }} />
                                                <span>Operations</span>
                                            </div>

                                            <div className="ops-row">
                                                <div className="ops-label">
                                                    <h4>Store Status</h4>
                                                    <p>Currently taking orders</p>
                                                </div>
                                                <div className="switch-toggle active">
                                                    <div className="switch-handle"></div>
                                                </div>
                                            </div>

                                            <div className="ops-row">
                                                <div className="ops-label">
                                                    <h4>Featured Profile</h4>
                                                    <p>Higher visibility in search</p>
                                                </div>
                                                <div className="switch-toggle">
                                                    <div className="switch-handle float-left"></div>
                                                </div>
                                            </div>

                                            <div className="ops-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', borderBottom: 'none', paddingBottom: '0', marginBottom: '0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                    <div className="ops-label" style={{ marginBottom: '0' }}><h4>Delivery Radius</h4></div>
                                                    <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800' }}>12 km</span>
                                                </div>

                                                <div className="range-slider-container" style={{ width: '100%', padding: '0 5px' }}>
                                                    <input type="range" className="custom-range" min="1" max="50" defaultValue="12" style={{ width: '100%' }} />
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                        <span>1 km</span>
                                                        <span>25 km</span>
                                                        <span>50 km+</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="info-box-purple" style={{ marginTop: '1.5rem', background: '#f5f3ff', border: '1px solid #ede9fe', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem', color: '#6d28d9', lineHeight: '1.4' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                                                    <div style={{ background: '#8b5cf6', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', flexShrink: 0, marginTop: '2px' }}>?</div>
                                                    <span>Your delivery radius affects how many customers can find your shop. Increasing it may increase order volume.</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="qr-card-pro">
                                            <h3 className="qr-title">Customer QR</h3>
                                            <p className="qr-desc">Download and print your store QR for local flyers.</p>
                                            <button className="btn-download-assets">Download Assets</button>
                                        </div>

                                        <div className="sections-card-pro" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginTop: '2rem' }}>
                                            <div className="card-header-pro" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                                <div className="card-icon" style={{ background: '#fef3c7', color: '#d97706', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlusCircle size={24} /></div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Quick Sections</h3>
                                            </div>

                                            <div className="create-section-input" style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="New Section Name (e.g. Trendy)"
                                                        value={newSectionName}
                                                        onChange={(e) => setNewSectionName(e.target.value)}
                                                        style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem' }}
                                                    />
                                                    <button
                                                        onClick={handleCreateSection}
                                                        style={{ background: '#d97706', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Create a section first, then select it when adding products.</p>
                                            </div>

                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                                Your Collections:
                                            </p>
                                            <div className="section-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {sections.length > 0 ? sections.map(sec => (
                                                    <span key={sec.id} style={{ background: '#fef3c7', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#92400e' }}>
                                                        {sec.name}
                                                    </span>
                                                )) : (
                                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No sections created yet.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
            {isInvoiceModalOpen && (
                <InvoiceModal
                    order={selectedOrderForInvoice}
                    store={store}
                    onClose={() => {
                        setIsInvoiceModalOpen(false);
                        setSelectedOrderForInvoice(null);
                    }}
                />
            )}
        </div>
    );
};

export default SellerDashboard;
