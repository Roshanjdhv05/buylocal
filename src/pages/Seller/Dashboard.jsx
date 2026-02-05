import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
    Plus, Edit2, Trash2, Package, ShoppingCart,
    ChevronRight, TrendingUp, AlertCircle, Check,
    Upload, X, Image as ImageIcon, Settings,
    Archive, DollarSign, LogOut, User
} from 'lucide-react';

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
    const [showProductForm, setShowProductForm] = useState(false);
    const [isEditingStore, setIsEditingStore] = useState(false);
    const [bannerUpdating, setBannerUpdating] = useState(false);
    const [editedStore, setEditedStore] = useState({
        name: '', description: '', address: '', phone: '', city: '', state: '', delivery_time: ''
    });

    // src/pages/Seller/Dashboard.jsx - REMOVED

    const [newProduct, setNewProduct] = useState({
        name: '',
        category: 'Men',
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
                    .select('*, buyer:users(email)')
                    .eq('store_id', storeData.id)
                    .order('created_at', { ascending: false }));

                if (ordersError) throw ordersError;
                setOrders(ordersData || []);
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

    const handleAddProduct = async (e) => {
        e.preventDefault();
        alert('Attempting to add product...'); // Immediate feedback

        if (!store) {
            console.error('handleAddProduct: No store found');
            alert('Error: Store information not loaded correctly.');
            return;
        }

        if (!newProduct.online_price) {
            alert('Please enter an online price.');
            return;
        }

        console.log('handleAddProduct: Starting process');
        setUploading(true);

        try {
            // 1. Upload Images
            const imageUrls = [];
            if (selectedImages.length > 0) {
                console.log('handleAddProduct: Uploading', selectedImages.length, 'images');
                for (const file of selectedImages) {
                    const url = await uploadImage(file);
                    imageUrls.push(url);
                }
            }
            console.log('handleAddProduct: All images ready:', imageUrls);

            // 2. Insert Product
            const onlinePrice = parseFloat(newProduct.online_price);
            if (isNaN(onlinePrice)) throw new Error('Invalid online price');

            const productToInsert = {
                ...newProduct,
                store_id: store.id,
                online_price: onlinePrice,
                offline_price: newProduct.offline_price ? parseFloat(newProduct.offline_price) : null,
                images: imageUrls
            };
            console.log('handleAddProduct: Inserting:', productToInsert);

            const { data, error } = await supabase
                .from('products')
                .insert([productToInsert])
                .select();

            if (error) {
                console.error('handleAddProduct: DB error:', error.message, error);
                throw error;
            }

            console.log('handleAddProduct: Product successfully added:', data[0]);
            alert('Product added successfully!');
            setProducts([...products, data[0]]);
            setShowProductForm(false);
            setNewProduct({
                name: '', category: 'Men', online_price: '', offline_price: '',
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
            <nav className="dashboard-topnav glass-card">
                <div className="topnav-left">
                    <Link to="/" className="topnav-branding">Buy<span>Local</span></Link>
                    <div className="topnav-links desktop-only">
                        <Link to="/">Home</Link>
                        <Link to="/categories">Categories</Link>
                    </div>
                </div>
                <div className="topnav-right">
                    <div className="topnav-links desktop-only">
                        <Link to="/seller/dashboard" className="active">Dashboard</Link>
                        <Link to="/orders">Orders</Link>
                    </div>
                    <button onClick={handleLogout} className="logout-btn-refined">
                        <LogOut size={18} /> <span>Logout</span>
                    </button>
                    <Link to="/cart" className="cart-icon-btn">
                        <ShoppingCart size={22} />
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </Link>
                </div>
            </nav>

            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div>
                        <h1>Seller Dashboard</h1>
                        <p>Manage your store, products, and orders</p>
                    </div>
                    <div className="store-badge">
                        <span>{store?.name} &bull; {store?.city}</span>
                    </div>
                </header>

                <div className="stats-grid">
                    <div className="stat-card glass-card">
                        <div className="stat-info">
                            <h3>Total Products</h3>
                            <p>{products.length}</p>
                        </div>
                        <Archive className="stat-icon" />
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-info">
                            <h3>Pending Orders</h3>
                            <p>{orders.filter(o => o.status === 'pending').length}</p>
                        </div>
                        <ShoppingCart className="stat-icon" />
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-info">
                            <h3>Total Revenue</h3>
                            <p>₹{orders.reduce((acc, o) => acc + (o.status === 'delivered' ? o.total_amount : 0), 0).toFixed(2)}</p>
                        </div>
                        <DollarSign className="stat-icon" />
                    </div>
                </div>

                <nav className="dashboard-tabs">
                    {['overview', 'products', 'orders'].map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                    <button
                        className={`tab-btn tab-highlight ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('settings');
                            setEditedStore({
                                name: store?.name || '',
                                description: store?.description || '',
                                address: store?.address || '',
                                phone: store?.phone || '',
                                city: store?.city || '',
                                state: store?.state || '',
                                delivery_time: store?.delivery_time || ''
                            });
                        }}
                    >
                        Store Settings
                    </button>
                </nav>

                <main className="dashboard-main-content">
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            <section className="orders-section glass-card">
                                <div className="section-header">
                                    <h2>Recent Orders</h2>
                                    <Link to="/seller/orders" className="view-all">View All <ChevronRight size={16} /></Link>
                                </div>
                                <div className="orders-list">
                                    {orders.length === 0 ? (
                                        <p className="empty-state">No orders yet</p>
                                    ) : (
                                        orders.slice(0, 5).map(order => (
                                            <div key={order.id} className="order-item">
                                                <div className="order-info">
                                                    <p className="order-id">#ID-{order.id.slice(0, 8)}</p>
                                                    <p className="order-amount">₹{order.total_amount}</p>
                                                </div>
                                                <div className="order-status-badge" data-status={order.status}>
                                                    {order.status}
                                                </div>
                                                <div className="order-actions">
                                                    {order.status === 'pending' && (
                                                        <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="btn-icon accept"><Check size={18} /></button>
                                                    )}
                                                    {order.status === 'accepted' && (
                                                        <button onClick={() => updateOrderStatus(order.id, 'dispatched')} className="btn-icon dispatch"><Package size={18} /></button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="products-tab">
                            <section className="product-management glass-card">
                                <div className="section-header">
                                    <h2>Product Management</h2>
                                    <button className="btn-primary" onClick={() => setShowProductForm(true)}>
                                        <Plus size={20} /> Add Product
                                    </button>
                                </div>

                                <div className="products-grid-detailed">
                                    {products.map(product => (
                                        <div key={product.id} className="product-card-mini glass-card">
                                            <div className="product-img">
                                                {product.images?.[0] ? <img src={product.images[0]} alt={product.name} /> : <Package size={32} />}
                                            </div>
                                            <div className="product-details">
                                                <h4>{product.name}</h4>
                                                <p className="category">{product.category}</p>
                                                <p className="price">₹{product.online_price}</p>
                                                <div className="product-actions">
                                                    <button className="btn-icon-sm"><Edit2 size={14} /></button>
                                                    <button className="btn-icon-sm danger"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Product Form Overlay */}
                            {showProductForm && (
                                <div className="overlay">
                                    <div className="modal glass-card">
                                        <div className="modal-header">
                                            <h2>Add New Product</h2>
                                            <button className="close-btn" onClick={() => setShowProductForm(false)}>&times;</button>
                                        </div>
                                        <form onSubmit={handleAddProduct} className="product-form-new">
                                            <div className="form-row">
                                                <div className="input-group">
                                                    <label>Product Name *</label>
                                                    <input required placeholder="Enter product name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                                                </div>
                                                <div className="input-group">
                                                    <label>Category *</label>
                                                    <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                                                        <option value="Men">Men</option>
                                                        <option value="Women">Women</option>
                                                        <option value="Kids">Kids</option>
                                                        <option value="Electronics">Electronics</option>
                                                        <option value="Home">Home</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="input-group">
                                                <label>Available Sizes</label>
                                                <div className="size-tags">
                                                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                                        <button
                                                            key={size}
                                                            type="button"
                                                            className={`size-tag ${newProduct.sizes.includes(size) ? 'active' : ''}`}
                                                            onClick={() => toggleSize(size)}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>


                                            <div className="form-row">
                                                <div className="input-group">
                                                    <label>Age Group</label>
                                                    <select value={newProduct.age_group} onChange={e => setNewProduct({ ...newProduct, age_group: e.target.value })}>
                                                        <option>Adults</option>
                                                        <option>Teens</option>
                                                        <option>Kids</option>
                                                        <option>Infants</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="input-group">
                                                <label>Description</label>
                                                <textarea rows="3" placeholder="Describe your product..." value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
                                            </div>

                                            <div className="form-row">
                                                <div className="input-group">
                                                    <label>Online Price *</label>
                                                    <input type="number" required placeholder="0.00" value={newProduct.online_price} onChange={e => setNewProduct({ ...newProduct, online_price: e.target.value })} />
                                                </div>
                                                <div className="input-group">
                                                    <label>Offline Price</label>
                                                    <input type="number" placeholder="0.00" value={newProduct.offline_price} onChange={e => setNewProduct({ ...newProduct, offline_price: e.target.value })} />
                                                </div>
                                                <div className="input-group">
                                                    <label>Estimated Delivery</label>
                                                    <input placeholder="e.g., 2-5 days" value={newProduct.delivery_time} onChange={e => setNewProduct({ ...newProduct, delivery_time: e.target.value })} />
                                                </div>
                                            </div>

                                            <div className="input-group-checkbox">
                                                <input type="checkbox" id="cod" checked={newProduct.cod_available} onChange={e => setNewProduct({ ...newProduct, cod_available: e.target.checked })} />
                                                <label htmlFor="cod">Cash on Delivery Available</label>
                                            </div>

                                            <div className="upload-section-new">
                                                <label>Product Images</label>
                                                <div className="upload-dropzone">
                                                    {selectedImages.length === 0 ? (
                                                        <div className="dropzone-content">
                                                            <Upload size={32} />
                                                            <p>Upload product images</p>
                                                            <label className="btn-outline-sm">
                                                                Choose Images
                                                                <input type="file" multiple accept="image/*" onChange={handleImageChange} hidden />
                                                            </label>
                                                        </div>
                                                    ) : (
                                                        <div className="images-preview-grid">
                                                            {imagePreviews.map((url, i) => (
                                                                <div key={i} className="preview-container-mini">
                                                                    <img src={url} alt="Preview" />
                                                                    <button type="button" className="remove-btn" onClick={() => removeImage(i)}><X size={14} /></button>
                                                                </div>
                                                            ))}
                                                            <label className="add-more-btn">
                                                                <Plus size={24} />
                                                                <input type="file" multiple accept="image/*" onChange={handleImageChange} hidden />
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="modal-footer">
                                                <button type="button" className="btn-text" onClick={() => setShowProductForm(false)}>Cancel</button>
                                                <button type="submit" className="btn-primary" disabled={uploading}>
                                                    {uploading ? 'Adding...' : 'Add Product'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="orders-tab">
                            <section className="order-management glass-card">
                                <div className="section-header">
                                    <h2>Order Management</h2>
                                </div>
                                <div className="orders-detailed-list">
                                    {orders.length === 0 ? (
                                        <p className="empty-state">No orders yet</p>
                                    ) : (
                                        orders.map(order => (
                                            <div key={order.id} className="order-card-detailed glass-card">
                                                <div className="order-card-header">
                                                    <div className="order-meta">
                                                        <h3>Order #{order.id.slice(0, 8)}</h3>
                                                        <span className="order-status-badge" data-status={order.status}>
                                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <div className="order-total-amount">
                                                        ₹{parseFloat(order.total_amount).toFixed(2)}
                                                    </div>
                                                </div>

                                                <div className="order-card-body">
                                                    <div className="order-info-group">
                                                        <p><strong>Ordered:</strong> {new Date(order.created_at).toLocaleString()}</p>
                                                        <p><strong>Customer:</strong> {order.buyer?.email || 'N/A'}</p>
                                                    </div>

                                                    <div className="order-items-section">
                                                        <h4>Items:</h4>
                                                        <div className="order-items-list">
                                                            {order.items?.map((item, idx) => (
                                                                <div key={idx} className="order-item-row">
                                                                    <span className="item-name">{item.name}</span>
                                                                    <div className="item-meta">
                                                                        <span>₹{item.price}</span>
                                                                        <span className="qty">Qty: {item.quantity || 1}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="order-address-section">
                                                        <h4>Delivery Address:</h4>
                                                        <p className="address-text">{order.shipping_address || 'No address provided'}</p>
                                                    </div>
                                                </div>

                                                <div className="order-card-actions">
                                                    {order.status === 'pending' && (
                                                        <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="btn-primary-sm">Accept Order</button>
                                                    )}
                                                    {order.status === 'accepted' && (
                                                        <button onClick={() => updateOrderStatus(order.id, 'dispatched')} className="btn-primary-sm">Dispatch Order</button>
                                                    )}
                                                    {order.status === 'dispatched' && (
                                                        <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="btn-success-sm">Mark Delivered</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="settings-tab-refined glass-card">
                            <div className="settings-header">
                                <h2>Store Settings</h2>
                                <button className="btn-primary-sm edit-store-trigger" onClick={() => setIsEditingStore(true)}>
                                    <Edit2 size={16} /> Edit Store
                                </button>
                            </div>

                            <div className="store-profile-details">
                                <div className="detail-hero">
                                    <h3>{store?.name}</h3>
                                    <p>{store?.description}</p>
                                </div>

                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Address:</label>
                                        <p>{store?.address || 'Not set'}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Phone:</label>
                                        <p>{store?.phone || 'Not set'}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Delivery Time:</label>
                                        <p>{store?.delivery_time || 'Not set'}</p>
                                    </div>
                                </div>

                                <div className="banner-management">
                                    <label>Store Banner:</label>
                                    <div className="banner-preview-wrapper">
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

                                <div className="gallery-management">
                                    <div className="section-header-sm">
                                        <label>Store Gallery:</label>
                                        <label className="btn-primary-sm gallery-add-btn">
                                            <Plus size={16} /> Add Media
                                            <input type="file" hidden multiple accept="image/*,video/*" onChange={handleGalleryUpload} />
                                        </label>
                                    </div>
                                    <div className="gallery-preview-grid">
                                        {store?.gallery_urls?.map((url, idx) => {
                                            const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video');
                                            return (
                                                <div key={idx} className="gallery-item-preview">
                                                    {isVideo ? (
                                                        <video src={url} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                                                    ) : (
                                                        <img src={url} alt={`Gallery ${idx}`} />
                                                    )}
                                                    <button className="delete-gallery-img" onClick={() => handleDeleteGalleryImage(url)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {(!store?.gallery_urls || store.gallery_urls.length === 0) && (
                                            <p className="empty-gallery">No gallery photos added yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isEditingStore && (
                                <div className="overlay">
                                    <div className="modal-refined glass-card">
                                        <div className="modal-header">
                                            <h2>Edit Store Details</h2>
                                            <button className="close-btn" onClick={() => setIsEditingStore(false)}>&times;</button>
                                        </div>
                                        <form onSubmit={handleUpdateStore} className="edit-store-form">
                                            <div className="input-group">
                                                <label>Store Name</label>
                                                <input required value={editedStore.name} onChange={e => setEditedStore({ ...editedStore, name: e.target.value })} />
                                            </div>
                                            <div className="input-group">
                                                <label>Description</label>
                                                <textarea rows="3" value={editedStore.description} onChange={e => setEditedStore({ ...editedStore, description: e.target.value })} />
                                            </div>
                                            <div className="form-row-multi">
                                                <div className="input-group">
                                                    <label>Phone</label>
                                                    <input value={editedStore.phone} onChange={e => setEditedStore({ ...editedStore, phone: e.target.value })} />
                                                </div>
                                                <div className="input-group">
                                                    <label>Delivery Time</label>
                                                    <input value={editedStore.delivery_time} onChange={e => setEditedStore({ ...editedStore, delivery_time: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>Full Address</label>
                                                <input value={editedStore.address} onChange={e => setEditedStore({ ...editedStore, address: e.target.value })} />
                                            </div>
                                            <div className="modal-footer-refined">
                                                <button type="button" className="btn-cancel" onClick={() => setIsEditingStore(false)}>Cancel</button>
                                                <button type="submit" className="btn-save" disabled={uploading}>
                                                    {uploading ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <style>{`
        .dashboard-wrapper { min-height: 100vh; background: var(--bg-main); }
        .dashboard-topnav { position: sticky; top: 0; left: 0; right: 0; height: 75px; display: flex; justify-content: space-between; align-items: center; padding: 0 4rem; z-index: 900; border-radius: 0; border-bottom: 1px solid var(--border); }
        .topnav-left, .topnav-right { display: flex; align-items: center; gap: 2.5rem; }
        
        .topnav-branding { font-size: 1.6rem; font-weight: 800; color: #1a1a1a; text-decoration: none; display: flex; align-items: center; }
        .topnav-branding span { color: var(--primary); }

        .topnav-links { display: flex; gap: 2rem; }
        .topnav-links a { font-weight: 600; color: var(--text-muted); transition: var(--transition); font-size: 0.95rem; }
        .topnav-links a:hover, .topnav-links a.active { color: var(--primary); }

        .logout-btn-refined { color: var(--error); background: transparent; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: var(--radius-sm); border: none; cursor: pointer; transition: var(--transition); }
        .logout-btn-refined:hover { background: rgba(239, 68, 68, 0.08); }

        .cart-icon-btn { position: relative; color: var(--text-main); display: flex; align-items: center; }
        .cart-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: var(--secondary);
            color: white;
            font-size: 0.65rem;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 700;
        }

        .dashboard-container { padding: 3rem 4rem 6rem; max-width: 1400px; margin: 0 auto; color: var(--text-main); }
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; }
        .dashboard-header h1 { font-size: 2.25rem; font-weight: 800; background: linear-gradient(135deg, var(--text-main) 0%, var(--primary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .dashboard-header p { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }
        .store-badge { background: rgba(var(--primary-rgb), 0.1); padding: 0.5rem 1rem; border-radius: 99px; border: 1px solid rgba(var(--primary-rgb), 0.2); font-weight: 600; color: var(--primary); }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
        .stat-card { padding: 2rem; display: flex; justify-content: space-between; align-items: center; border-radius: var(--radius-lg); }
        .stat-info h3 { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem; }
        .stat-info p { font-size: 2rem; font-weight: 800; }
        .stat-icon { color: var(--primary); width: 3rem; height: 3rem; background: rgba(var(--primary-rgb), 0.1); padding: 0.75rem; border-radius: var(--radius-md); }

        .dashboard-tabs { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
        .tab-btn { padding: 0.75rem 1.5rem; font-weight: 600; color: var(--text-muted); border-radius: var(--radius-md); transition: var(--transition); background: transparent; }
        .tab-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-main); }
        .tab-btn.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3); }
        .tab-highlight { background: #ffff00; color: #000; }
        .tab-highlight:hover { background: #e6e600; color: #000; }
        .tab-highlight.active { background: #000; color: #ffff00; border: 2px solid #ffff00; }

        .settings-tab-refined { padding: 2.5rem; }
        .settings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .settings-header h2 { font-size: 1.8rem; font-weight: 800; }
        
        .store-profile-details { display: flex; flex-direction: column; gap: 2rem; }
        .detail-hero h3 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; }
        .detail-hero p { color: var(--text-muted); font-size: 1.1rem; }
        
        .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
        .detail-item label { display: block; font-size: 0.875rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 700; }
        .detail-item p { font-size: 1.1rem; font-weight: 600; }
        
        .banner-management label { display: block; font-size: 0.875rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 1rem; font-weight: 700; }
        .banner-preview-wrapper { position: relative; width: 100%; height: 200px; border-radius: 16px; overflow: hidden; background: rgba(0,0,0,0.1); }
        .banner-preview-img { width: 100%; height: 100%; object-fit: cover; }
        .banner-missing { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); }
        .banner-upload-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: 0.3s; cursor: pointer; font-weight: 700; }
        .banner-preview-wrapper:hover .banner-upload-overlay { opacity: 1; }

        .gallery-management { margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 2rem; }
        .section-header-sm { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .gallery-add-btn { cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .gallery-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
        .gallery-item-preview { position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.05); }
        .gallery-item-preview img { width: 100%; height: 100%; object-fit: cover; }
        .delete-gallery-img { position: absolute; top: 8px; right: 8px; background: rgba(var(--error-rgb), 0.9); color: white; border: none; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: scale(0); transition: 0.2s; cursor: pointer; }
        .gallery-item-preview:hover .delete-gallery-img { transform: scale(1); }
        .empty-gallery { color: var(--text-muted); font-size: 0.95rem; font-style: italic; }

        /* Modal Refined */
        .modal-refined { width: 100%; max-width: 600px; padding: 2.5rem; position: relative; border: 1px solid var(--border); }
        .edit-store-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row-multi { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .modal-footer-refined { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
        .btn-cancel { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; color: var(--text-muted); }
        .btn-save { padding: 0.75rem 1.5rem; background: var(--primary); color: white; border-radius: 8px; font-weight: 700; }

        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .section-header h2 { font-size: 1.5rem; font-weight: 700; }

        .products-grid-detailed { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .product-card-mini { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; border-radius: var(--radius-md); }
        .product-img { width: 100%; aspect-ratio: 4/3; background: rgba(0,0,0,0.1); border-radius: var(--radius-sm); overflow: hidden; }
        .product-img img { width: 100%; height: 100%; object-fit: cover; }
        .product-details h4 { font-size: 1.1rem; margin-bottom: 0.25rem; }
        .product-details .category { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem; }
        .product-details .price { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
        .product-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }

        .product-form-new { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .size-tags { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .size-tag { padding: 0.5rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--text-main); font-weight: 600; cursor: pointer; transition: var(--transition); }
        .size-tag.active { background: var(--primary); border-color: var(--primary); color: white; }
        
        .color-input-wrapper { display: flex; gap: 0.5rem; }
        .color-labels { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
        .color-label { display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.875rem; border: 1px solid var(--border); }
        .color-label svg { cursor: pointer; color: var(--error); }

        .input-group-checkbox { display: flex; align-items: center; gap: 0.75rem; margin: 0.5rem 0; }
        .input-group-checkbox input { width: 1.25rem; height: 1.25rem; accent-color: var(--primary); }

        .upload-section-new label { display: block; margin-bottom: 1rem; font-weight: 600; font-size: 1rem; }
        .upload-dropzone { border: 2px dashed var(--border); border-radius: var(--radius-lg); padding: 2rem; text-align: center; background: rgba(255,255,255,0.02); }
        .dropzone-content { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--text-muted); }
        .btn-outline-sm { display: inline-block; padding: 0.5rem 1.5rem; border: 1px solid var(--primary); color: var(--primary); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; }
        
        .images-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem; }
        .preview-container-mini { position: relative; aspect-ratio: 1; border-radius: var(--radius-md); overflow: hidden; }
        .preview-container-mini img { width: 100%; height: 100%; object-fit: cover; }
        .preview-container-mini .remove-btn { position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
        .add-more-btn { aspect-ratio: 1; border: 2px dashed var(--border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); }

        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
        .btn-text { background: transparent; color: var(--text-muted); font-weight: 600; padding: 0.75rem 1.5rem; }

        .orders-detailed-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .order-card-detailed { padding: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--border); }
        .order-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
        .order-meta h3 { font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
        .order-total-amount { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

        .order-card-body { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem; }
        .order-info-group p { font-size: 0.9375rem; margin-bottom: 0.5rem; color: var(--text-muted); }
        .order-info-group strong { color: var(--text-main); }

        .order-items-section h4, .order-address-section h4 { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.75rem; }
        .order-items-list { background: rgba(0,0,0,0.05); border-radius: var(--radius-sm); padding: 1rem; }
        .order-item-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
        .order-item-row:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.05); }
        .item-name { font-weight: 600; }
        .item-meta { display: flex; gap: 1.5rem; font-size: 0.875rem; color: var(--text-muted); }
        .qty { font-weight: 700; color: var(--primary); }

        .address-text { font-size: 0.9375rem; line-height: 1.6; color: var(--text-main); white-space: pre-line; }

        .order-card-actions { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
        .btn-primary-sm { padding: 0.625rem 1.25rem; background: var(--primary); color: white; border-radius: var(--radius-md); font-weight: 600; font-size: 0.875rem; }
        .btn-success-sm { padding: 0.625rem 1.25rem; background: #22c55e; color: white; border-radius: var(--radius-md); font-weight: 600; font-size: 0.875rem; }

        .order-status-badge { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .order-status-badge[data-status="pending"] { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
        .order-status-badge[data-status="accepted"] { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); }
        .order-status-badge[data-status="dispatched"] { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
        .order-status-badge[data-status="delivered"] { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }

        @media (max-width: 768px) {
          .order-card-body { grid-template-columns: 1fr; }
        }
      `}</style>
            </div>
        </div>
    );
};

export default SellerDashboard;
