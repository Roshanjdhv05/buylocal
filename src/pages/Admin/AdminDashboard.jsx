import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
    Users, Store, Package, ShoppingBag, IndianRupee, LogOut, 
    TrendingUp, Search, ChevronLeft, ShieldCheck, UserPlus, 
    ShieldAlert, Edit, Trash2, CheckCircle, XCircle, Settings,
    Lock, Unlock, Clock, Database, Plus, Eye, EyeOff, Pencil, Check, X
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalStores: 0,
        activeStores: 0,
        totalSellers: 0,
        activeSellers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0
    });
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [selectedSubSeller, setSelectedSubSeller] = useState(null);
    const [subTier, setSubTier] = useState('free');
    const [subMonths, setSubMonths] = useState(1);
    const [subProductLimit, setSubProductLimit] = useState(50);
    const [storeProducts, setStoreProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [allProducts, setAllProducts] = useState([]);
    const [banners, setBanners] = useState([]);
    const [desktopBanner, setDesktopBanner] = useState(null);
    const [mobileBanner, setMobileBanner] = useState(null);
    const [desktopPreview, setDesktopPreview] = useState(null);
    const [mobilePreview, setMobilePreview] = useState(null);
    const [categories, setCategories] = useState([]);
    const [sections, setSections] = useState([]);
    const [subsections, setSubsections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [newSection, setNewSection] = useState({ name: '' });
    const [newSubsection, setNewSubsection] = useState({ name: '', section_id: null });

    // Category Image Upload State
    const [sectionFile, setSectionFile] = useState(null);
    const [sectionPreview, setSectionPreview] = useState(null);
    const [subsectionFile, setSubsectionFile] = useState(null);
    const [subsectionPreview, setSubsectionPreview] = useState(null);
    const [categoryUploading, setCategoryUploading] = useState(false);

    // Editing States
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [editingSectionName, setEditingSectionName] = useState('');
    const [editSectionFile, setEditSectionFile] = useState(null);
    const [editSectionPreview, setEditSectionPreview] = useState(null);

    const [editingSubsectionId, setEditingSubsectionId] = useState(null);
    const [editingSubsectionName, setEditingSubsectionName] = useState('');
    const [editSubsectionFile, setEditSubsectionFile] = useState(null);
    const [editSubsectionPreview, setEditSubsectionPreview] = useState(null);


    // Subscription Control State
    const [isSubSectionEnabled, setIsSubSectionEnabled] = useState(false);
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);
    const [subPassword, setSubPassword] = useState('');
    const [showSubPassword, setShowSubPassword] = useState(false);
    const [globalProductLimit, setGlobalProductLimit] = useState(50);

    // Product CRUD State (within Store Details)
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        online_price: '',
        market_price: '',
        category: '',
        stock_status: 'in_stock',
        delivery_type: 'express',
        images: []
    });
    const [productImages, setProductImages] = useState([]);
    const [productPreviews, setProductPreviews] = useState([]);

    const [homeCategories, setHomeCategories] = useState([]);
    const [isHomeCategoryTab, setIsHomeCategoryTab] = useState(false);

    useEffect(() => {
        fetchAdminData();
        fetchBanners();
        fetchCategories();
        fetchSections();
        fetchHomeCategories();
    }, []);

    const fetchHomeCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('home_page_categories')
                .select('*')
                .order('id');
            if (error) throw error;
            
            if (data?.length === 0) {
                // Auto-seed table if empty
                const { error: seedError } = await supabase
                    .from('home_page_categories')
                    .insert([
                        { name: 'Men' },
                        { name: 'Women' },
                        { name: 'Kids' },
                        { name: 'Others' }
                    ]);
                if (seedError) throw seedError;
                fetchHomeCategories(); // Refresh
                return;
            }
            setHomeCategories(data || []);
        } catch (e) { console.error('Error fetching home categories:', e.message); }
    };

    const fetchSections = async () => {
        try {
            const { data, error } = await supabase
                .from('category_sections')
                .select('*')
                .order('name');
            if (error) throw error;
            setSections(data || []);
            if (data?.length > 0 && !selectedSectionId) {
                setSelectedSectionId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching sections:', error.message);
        }
    };

    const fetchSubsections = async (sectionId) => {
        if (!sectionId) return;
        try {
            const { data, error } = await supabase
                .from('category_subsections')
                .select('*')
                .eq('section_id', sectionId)
                .order('name');
            if (error) throw error;
            setSubsections(data || []);
        } catch (error) {
            console.error('Error fetching subsections:', error.message);
        }
    };

    useEffect(() => {
        if (selectedSectionId) {
            fetchSubsections(selectedSectionId);
        }
    }, [selectedSectionId]);


    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });
            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error.message);
        }
    };

    useEffect(() => {
        if (editingProduct) {
            setProductForm({
                name: editingProduct.name || '',
                description: editingProduct.description || '',
                online_price: editingProduct.online_price || '',
                market_price: editingProduct.market_price || '',
                category: editingProduct.category || '',
                stock_status: editingProduct.stock_status || 'in_stock',
                delivery_type: editingProduct.delivery_type || 'express',
                images: editingProduct.images || []
            });
            setProductPreviews(editingProduct.images || []);
        } else {
            setProductForm({
                name: '',
                description: '',
                online_price: '',
                market_price: '',
                category: '',
                stock_status: 'in_stock',
                delivery_type: 'express',
                images: []
            });
            setProductPreviews([]);
            setProductImages([]);
        }
    }, [editingProduct, showProductModal]);

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
            // Fetch users data
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Fetch stores data
            const { data: storesData, error: storesError } = await supabase
                .from('stores')
                .select(`*`);

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
            
            const sellersData = usersData.filter(u => u.role === 'seller');
            const buyersData = usersData.filter(u => u.role === 'buyer');

            setStats({
                totalUsers: usersData.length,
                activeUsers: usersData.filter(u => u.is_active !== false).length,
                totalStores: storesData.length,
                activeStores: storesData.filter(s => s.is_active !== false).length,
                totalSellers: sellersData.length,
                activeSellers: sellersData.filter(u => u.is_active !== false).length,
                totalProducts: productCount || 0,
                totalOrders: ordersData.length,
                totalRevenue: totalRev
            });

            setUsers(usersData);
            setSellers(sellersData);
            setStores(storeStats);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserStatusToggle = async (userId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: !currentStatus })
                .eq('id', userId);

            if (error) throw error;
            fetchAdminData();
        } catch (error) {
            alert('Error updating user status: ' + error.message);
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            fetchAdminData();
        } catch (error) {
            alert('Error deleting user: ' + error.message);
        }
    };

    const fetchAllProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, stores(name)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setAllProducts(data || []);
        } catch (error) {
            console.error('Error fetching all products:', error.message);
        }
    };

    const fetchStoreProducts = async (storeId) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            console.log('Fetched products for store:', storeId, data);
            setStoreProducts(data || []);
        } catch (error) {
            console.error('Error fetching store products:', error.message);
        }
    };

    const handleUpdateSubscription = async (storeId, tier, months, limit) => {
        try {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + months);

            const { error } = await supabase
                .from('stores')
                .update({ 
                    subscription_tier: tier,
                    subscription_end_date: months === 0 ? null : endDate.toISOString(),
                    product_limit: limit || 50
                })
                .eq('id', storeId);

            if (error) throw error;
            
            // Refresh local state
            const updatedStores = stores.map(s => 
                s.id === storeId 
                    ? { ...s, subscription_tier: tier, subscription_end_date: months === 0 ? null : endDate.toISOString(), product_limit: limit || 50 } 
                    : s
            );
            setStores(updatedStores);
            setSelectedStore({ ...selectedStore, subscription_tier: tier, subscription_end_date: months === 0 ? null : endDate.toISOString(), product_limit: limit || 50 });
            
            alert(`Subscription updated to ${tier} for ${months} months`);
        } catch (error) {
            console.error('Error updating subscription:', error.message);
        }
    };

    const handleStoreClick = (store) => {
        setSelectedStore(store);
        fetchStoreProducts(store.id);
        setActiveTab('store-details');
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;
            fetchStoreProducts(selectedStore.id);
            fetchAdminData();
        } catch (error) {
            alert('Error deleting product: ' + error.message);
        }
    };

    const handleDeleteStore = async (store) => {
        const password = window.prompt(`Are you sure you want to delete "${store.name}"? This will delete all products and orders linked to this store.\n\nEnter Admin Password to confirm:`);
        
        if (!password) return;
        
        if (password !== 'roshan') {
            alert('Incorrect password. Deletion cancelled.');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('stores')
                .delete()
                .eq('id', store.id);

            if (error) throw error;
            
            console.log('Successfully deleted store:', store.id);
            
            // 1. Remove from local state immediately for instant feedback
            setStores(prev => prev.filter(s => s.id !== store.id));
            
            alert('Store deleted successfully.');
            
            // 2. Wait for the server to confirm the fresh state
            await fetchAdminData();
            console.log('Dashboard data refreshed after deletion.');
        } catch (error) {
            console.error('Failed to delete store:', error);
            alert('Error deleting store: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrls = [...productForm.images];

            // Upload new images if any
            if (productImages.length > 0) {
                for (const file of productImages) {
                    const ext = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${ext}`;
                    const filePath = `products/${selectedStore.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('store-gallery')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('store-gallery')
                        .getPublicUrl(filePath);
                    
                    imageUrls.push(publicUrl);
                }
            }

            const productData = {
                ...productForm,
                images: imageUrls,
                store_id: selectedStore.id,
                owner_id: selectedStore.owner_id
            };

            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
            }

            setShowProductModal(false);
            setEditingProduct(null);
            setProductForm({
                name: '',
                description: '',
                online_price: '',
                market_price: '',
                category: '',
                stock_status: 'in_stock',
                delivery_type: 'express',
                images: []
            });
            setProductImages([]);
            setProductPreviews([]);
            fetchStoreProducts(selectedStore.id);
            fetchAdminData();
        } catch (error) {
            alert('Error saving product: ' + error.message);
        } finally {
            setUploading(false);
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
                <LoadingSpinner />
                <p>Loading overview...</p>
            </div>
        );
    }

    const uploadCategoryImage = async (file) => {
        if (!file) return null;
        try {
            setCategoryUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `categories/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('banners')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('banners')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error.message);
            alert('Upload failed: ' + error.message);
            return null;
        } finally {
            setCategoryUploading(false);
        }
    };

    const handleEditSaveSection = async (sectionId) => {
        if (!editingSectionName) return;
        setCategoryUploading(true);
        try {
            let imgUrl = editSectionPreview;
            if (editSectionFile) {
                const uploadedUrl = await uploadCategoryImage(editSectionFile);
                if (uploadedUrl) imgUrl = uploadedUrl;
            }
            const { error } = await supabase
                .from('category_sections')
                .update({ name: editingSectionName, image_url: imgUrl })
                .eq('id', sectionId);
            if (error) throw error;
            setEditingSectionId(null);
            fetchSections();
        } catch (e) { alert(e.message); }
        finally { setCategoryUploading(false); }
    };

    const handleEditSaveSubsection = async (subId) => {
        if (!editingSubsectionName) return;
        setCategoryUploading(true);
        try {
            let imgUrl = editSubsectionPreview;
            if (editSubsectionFile) {
                const uploadedUrl = await uploadCategoryImage(editSubsectionFile);
                if (uploadedUrl) imgUrl = uploadedUrl;
            }
            const { error } = await supabase
                .from('category_subsections')
                .update({ name: editingSubsectionName, image_url: imgUrl })
                .eq('id', subId);
            if (error) throw error;
            setEditingSubsectionId(null);
            if (selectedSectionId) fetchSubsections(selectedSectionId);
        } catch (e) { alert(e.message); }
        finally { setCategoryUploading(false); }
    };

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
                        className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('users'); setSelectedStore(null); }}
                    >
                        <Users size={20} />
                        <span>Users</span>
                    </div>
                    <div 
                        className={`nav-item ${activeTab === 'sellers' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('sellers'); setSelectedStore(null); }}
                    >
                        <ShieldCheck size={20} />
                        <span>Sellers</span>
                    </div>
                    <div 
                        className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('subscriptions'); setSelectedStore(null); }}
                    >
                        <Settings size={20} />
                        <span>Subscriptions</span>
                    </div>
                    <div 
                        className={`nav-item ${activeTab === 'shops' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('shops'); setSelectedStore(null); }}
                    >
                        <Store size={20} />
                        <span>Shops</span>
                    </div>
                    <div 
                        className={`nav-item ${activeTab === 'all-products' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('all-products'); setSelectedStore(null); fetchAllProducts(); }}
                    >
                        <Package size={20} />
                        <span>Products</span>
                    </div>
                    <div 
                        className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('categories'); setSelectedStore(null); }}
                    >
                        <ShieldCheck size={20} />
                        <span>Categories</span>
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
                                : activeTab === 'users'
                                    ? 'User Management'
                                        : activeTab === 'sellers'
                                            ? 'Seller Accounts'
                                            : activeTab === 'subscriptions'
                                                ? 'Platform Control & Subscriptions'
                                                : activeTab === 'all-products'
                                                    ? 'Global Product Management'
                                                    : activeTab === 'shops'
                                                        ? 'Shop Management'
                                                        : 'Banner Management'
                        }
                    </h1>
                    {!selectedStore && (activeTab === 'overview' || activeTab === 'shops' || activeTab === 'all-products') && (
                        <div className="admin-search">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder={activeTab === 'all-products' ? "Search products..." : "Search stores..."}
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
                                    <h3>₹{(selectedStore.totalRevenue || 0).toLocaleString()}</h3>
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

                        <div className="admin-section subscription-management-card">
                            <div className="section-header">
                                <div className="header-with-badge">
                                    <h2>Subscription & Tier</h2>
                                    <span className={`tier-badge ${selectedStore.subscription_tier || 'free'}`}>
                                        {selectedStore.subscription_tier?.toUpperCase() || 'FREE'}
                                    </span>
                                </div>
                                {selectedStore.subscription_end_date && (
                                    <p className="expiry-text">Expires: {new Date(selectedStore.subscription_end_date).toLocaleDateString()}</p>
                                )}
                            </div>
                            
                            <div className="subscription-actions-grid">
                                <div className="sub-action-group">
                                    <h4>Upgrade Account Access</h4>
                                    <div className="btn-group">
                                        <button className="btn-sub" onClick={() => handleUpdateSubscription(selectedStore.id, 'premium', 1)}>1 Month</button>
                                        <button className="btn-sub" onClick={() => handleUpdateSubscription(selectedStore.id, 'premium', 6)}>6 Months</button>
                                        <button className="btn-sub" onClick={() => handleUpdateSubscription(selectedStore.id, 'premium', 12)}>12 Months</button>
                                        <button className="btn-sub reset" onClick={() => handleUpdateSubscription(selectedStore.id, 'free', 0)}>Reset to Free</button>
                                    </div>
                                </div>
                                <div className="sub-info-group">
                                    <p className="text-muted text-sm">Update the store subscription tier to grant more product limits or special visibility features.</p>
                                </div>
                            </div>
                        </div>

                        <div className="admin-section store-products-card">
                            <div className="section-header">
                                <h2>Store Products</h2>
                                <button className="btn-primary" onClick={() => { setEditingProduct(null); setShowProductModal(true); }}>
                                    <Plus size={18} /> Add Product
                                </button>
                            </div>
                            
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Product Name</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {storeProducts.length > 0 ? storeProducts.map(product => (
                                            <tr key={product.id}>
                                                <td>
                                                    <img 
                                                        src={product.images?.[0] || 'https://via.placeholder.com/50'} 
                                                        alt={product.name} 
                                                        className="table-thumbnail"
                                                    />
                                                </td>
                                                <td className="font-medium">{product.name}</td>
                                                <td>{product.category}</td>
                                                <td>₹{product.online_price}</td>
                                                <td>
                                                    <span className={`status-badge ${product.stock_status === 'in_stock' ? 'active' : 'inactive'}`}>
                                                        {product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button className="btn-icon-sm edit" onClick={() => { setEditingProduct(product); setShowProductModal(true); }}>
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="btn-icon-sm delete" onClick={() => handleDeleteProduct(product.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-8 text-muted">No products found for this store.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
                                    <h3>₹{(stats.totalRevenue || 0).toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>

                        <section className="admin-section">
                            <div className="section-header">
                                <h2>Recent Store Performance</h2>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Store Name</th>
                                            <th>Location</th>
                                            <th>Products</th>
                                            <th>Revenue</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStores.slice(0, 5).map(store => (
                                            <tr key={store.id}>
                                                <td className="font-medium clickable-name" onClick={() => handleStoreClick(store)}>
                                                    {store.name}
                                                </td>
                                                <td>{store.city || 'N/A'}</td>
                                                <td>{store.totalProducts}</td>
                                                <td className="revenue-cell">₹{(store.totalRevenue || 0).toLocaleString()}</td>
                                                <td>
                                                    <span className={`status-badge ${store.is_active !== false ? 'active' : 'inactive'}`}>
                                                        {store.is_active !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button className="btn-icon-sm view" onClick={() => handleStoreClick(store)} title="View Store & Products">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="btn-icon-sm delete" onClick={() => handleDeleteStore(store)} title="Delete Store">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="text-center mt-4">
                                    <button className="btn-secondary btn-sm" onClick={() => setActiveTab('shops')}>View All Shops</button>
                                </div>
                            </div>
                        </section>
                    </>
                ) : activeTab === 'shops' ? (
                    <div className="admin-shops-view">
                        <div className="admin-stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon stores"><Store size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Shops</p>
                                    <h3>{stats.totalStores}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon products"><Package size={24} /></div>
                                <div className="stat-info">
                                    <p>Active Shops</p>
                                    <h3>{stats.activeStores}</h3>
                                </div>
                            </div>
                        </div>

                        <section className="admin-section">
                            <div className="section-header">
                                <h2>All Registered Shops</h2>
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
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStores.map(store => (
                                            <tr key={store.id}>
                                                <td className="font-medium clickable-name" onClick={() => handleStoreClick(store)}>
                                                    {store.name}
                                                </td>
                                                <td>{store.city || 'N/A'}</td>
                                                <td>{store.totalProducts}</td>
                                                <td>{store.totalOrders}</td>
                                                <td className="revenue-cell">₹{(store.totalRevenue || 0).toLocaleString()}</td>
                                                <td>
                                                    <span className={`status-badge ${store.is_active !== false ? 'active' : 'inactive'}`}>
                                                        {store.is_active !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button className="btn-icon-sm view" onClick={() => handleStoreClick(store)} title="View Store & Products">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="btn-icon-sm delete" onClick={() => handleDeleteStore(store)} title="Delete Store">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                ) : activeTab === 'all-products' ? (
                    <div className="admin-products-view">
                        <section className="admin-section">
                            <div className="section-header">
                                <h2>All Platform Products</h2>
                                <p>Managing {allProducts.length} items from various shops.</p>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Product Name</th>
                                            <th>Shop</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allProducts.filter(p => 
                                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            p.stores?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map(product => (
                                            <tr key={product.id}>
                                                <td>
                                                    <img 
                                                        src={product.images?.[0] || 'https://via.placeholder.com/50'} 
                                                        alt={product.name} 
                                                        className="table-thumbnail"
                                                    />
                                                </td>
                                                <td className="font-medium">{product.name}</td>
                                                <td className="text-muted">{product.stores?.name}</td>
                                                <td>{product.category}</td>
                                                <td>₹{product.online_price}</td>
                                                <td>
                                                    <span className={`status-badge ${product.stock_status === 'in_stock' ? 'active' : 'inactive'}`}>
                                                        {product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button className="btn-icon-sm edit" onClick={() => { 
                                                        setSelectedStore({ id: product.store_id, owner_id: product.owner_id });
                                                        setEditingProduct(product); 
                                                        setShowProductModal(true); 
                                                    }}>
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="btn-icon-sm delete" onClick={() => {
                                                        const storeId = product.store_id;
                                                        handleDeleteProduct(product.id).then(() => {
                                                            fetchAllProducts();
                                                        });
                                                    }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="admin-users-view">
                        <div className="admin-stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon users"><Users size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Users</p>
                                    <h3>{stats.totalUsers}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon stores"><ShieldCheck size={24} /></div>
                                <div className="stat-info">
                                    <p>Active Users</p>
                                    <h3>{stats.activeUsers}</h3>
                                </div>
                            </div>
                        </div>

                        <section className="admin-section">
                            <div className="section-header">
                                <h2>All Registered Users</h2>
                                <div className="admin-search">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>User Info</th>
                                            <th>Role</th>
                                            <th>Location</th>
                                            <th>Joined Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.filter(u => 
                                            u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map(user => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="user-info-cell">
                                                        <span className="font-medium">{user.username}</span>
                                                        <span className="text-muted text-xs">{user.email}</span>
                                                    </div>
                                                </td>
                                                <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                                                <td>{user.city || 'N/A'}</td>
                                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`status-badge ${user.is_active !== false ? 'active' : 'inactive'}`}>
                                                        {user.is_active !== false ? 'Active' : 'Deactivated'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button 
                                                        className={`btn-icon-sm ${user.is_active !== false ? 'pause' : 'resume'}`}
                                                        onClick={() => handleUserStatusToggle(user.id, user.is_active !== false)}
                                                        title={user.is_active !== false ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {user.is_active !== false ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                    </button>
                                                    <button className="btn-icon-sm delete" onClick={() => deleteUser(user.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                ) : activeTab === 'sellers' ? (
                    <div className="admin-sellers-view">
                        <div className="admin-stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon users"><ShieldCheck size={24} /></div>
                                <div className="stat-info">
                                    <p>Total Sellers</p>
                                    <h3>{stats.totalSellers}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon stores"><CheckCircle size={24} /></div>
                                <div className="stat-info">
                                    <p>Active Sellers</p>
                                    <h3>{stats.activeSellers}</h3>
                                </div>
                            </div>
                        </div>

                        <section className="admin-section">
                            <div className="section-header">
                                <h2>Seller Accounts</h2>
                                <div className="admin-search">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search sellers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Seller Info</th>
                                            <th>Location</th>
                                            <th>Stores</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sellers.filter(s => 
                                            s.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            s.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map(seller => (
                                            <tr key={seller.id}>
                                                <td>
                                                    <div className="user-info-cell">
                                                        <span className="font-medium">{seller.username}</span>
                                                        <span className="text-muted text-xs">{seller.email}</span>
                                                    </div>
                                                </td>
                                                <td>{seller.city || 'N/A'}</td>
                                                <td>{stores.filter(st => st.owner_id === seller.id).length}</td>
                                                <td>
                                                    <span className={`status-badge ${seller.is_active !== false ? 'active' : 'inactive'}`}>
                                                        {seller.is_active !== false ? 'Active' : 'Deactivated'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button 
                                                        className={`btn-icon-sm ${seller.is_active !== false ? 'pause' : 'resume'}`}
                                                        onClick={() => handleUserStatusToggle(seller.id, seller.is_active !== false)}
                                                    >
                                                        {seller.is_active !== false ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                    </button>
                                                    <button className="btn-icon-sm delete" onClick={() => deleteUser(seller.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                ) : activeTab === 'subscriptions' ? (
                    <div className="admin-subscriptions-view">
                        <section className="admin-section subscription-gate">
                            <div className="gate-header">
                                <div className="gate-info">
                                    <ShieldAlert size={32} className="text-warning" />
                                    <div>
                                        <h2>Platform Subscription Control</h2>
                                        <p>Manage product limits and seller subscriptions. This section is locked for security.</p>
                                    </div>
                                </div>
                                <div className="gate-toggle">
                                    <span className="label-text">{isSubSectionEnabled ? 'Control Panel Unlocked' : 'Control Panel Locked'}</span>
                                    <label className="switch">
                                        <input 
                                            type="checkbox" 
                                            checked={isSubSectionEnabled}
                                            onChange={() => {
                                                if (isSubSectionEnabled) {
                                                    setIsSubSectionEnabled(false);
                                                } else {
                                                    setShowPasswordPopup(true);
                                                }
                                            }}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>

                            {showPasswordPopup && (
                                <div className="password-overlay">
                                    <div className="password-card">
                                        <h3>Admin Verification</h3>
                                        <p>Enter password to unlock subscription controls.</p>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type={showSubPassword ? 'text' : 'password'}
                                                placeholder="Enter password" 
                                                value={subPassword}
                                                onChange={(e) => setSubPassword(e.target.value)}
                                                style={{ paddingRight: '3rem', width: '100%' }}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        if (subPassword === 'roshan') {
                                                            setIsSubSectionEnabled(true);
                                                            setShowPasswordPopup(false);
                                                            setSubPassword('');
                                                            setShowSubPassword(false);
                                                        } else {
                                                            alert('Incorrect password');
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSubPassword(v => !v)}
                                                style={{
                                                    position: 'absolute', right: '0.75rem', top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0
                                                }}
                                                tabIndex={-1}
                                                aria-label={showSubPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showSubPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <div className="password-actions">
                                            <button className="btn-secondary" onClick={() => setShowPasswordPopup(false)}>Cancel</button>
                                            <button className="btn-primary" onClick={() => {
                                                if (subPassword === 'roshan') {
                                                    setIsSubSectionEnabled(true);
                                                    setShowPasswordPopup(false);
                                                    setSubPassword('');
                                                } else {
                                                    alert('Incorrect password');
                                                }
                                            }}>Unlock</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isSubSectionEnabled ? (
                                <div className="subscription-controls-grid">
                                    <div className="control-card seller-selection-card">
                                        <div className="card-header">
                                            <Users size={20} />
                                            <h3>1. Select Seller to Upgrade</h3>
                                        </div>
                                        <div className="admin-search mb-4">
                                            <Search size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search sellers by name or email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="seller-mini-list">
                                            {sellers.filter(s => 
                                                s.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                s.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).slice(0, 5).map(seller => (
                                                <div 
                                                    key={seller.id} 
                                                    className={`seller-mini-item ${selectedSubSeller?.id === seller.id ? 'selected' : ''}`}
                                                    onClick={() => setSelectedSubSeller(seller)}
                                                >
                                                    <div className="mini-info">
                                                        <span className="name">{seller.username}</span>
                                                        <span className="email">{seller.email}</span>
                                                    </div>
                                                    <div className="check-icon">
                                                        {selectedSubSeller?.id === seller.id && <CheckCircle size={16} />}
                                                    </div>
                                                </div>
                                            ))}
                                            {sellers.filter(s => 
                                                s.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                s.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).length === 0 && (
                                                <p className="text-center py-4 text-muted">No sellers found.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="control-card upgrade-action-card">
                                        <div className="card-header">
                                            <ShieldCheck size={20} />
                                            <h3>2. Configure & Apply Upgrade</h3>
                                        </div>
                                        {selectedSubSeller ? (
                                            <div className="upgrade-form">
                                                <div className="selected-seller-badge">
                                                    <span>Target: <strong>{selectedSubSeller.username}</strong></span>
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label>Select Membership Tier</label>
                                                    <div className="btn-group">
                                                        <button 
                                                            className={`btn-sub ${subTier === 'free' ? 'active' : ''}`}
                                                            onClick={() => setSubTier('free')}
                                                        >Free</button>
                                                        <button 
                                                            className={`btn-sub ${subTier === 'premium' ? 'active' : ''}`}
                                                            onClick={() => setSubTier('premium')}
                                                        >Premium</button>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Duration (Months)</label>
                                                    <div className="btn-group">
                                                        {[1, 6, 12].map(m => (
                                                            <button 
                                                                key={m}
                                                                className={`btn-sub ${subMonths === m ? 'active' : ''}`}
                                                                onClick={() => setSubMonths(m)}
                                                            >{m} Month{m > 1 ? 's' : ''}</button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Product Listing Limit</label>
                                                    <div className="limit-input-wrapper">
                                                        <input 
                                                            type="number" 
                                                            className="limit-input-sm"
                                                            value={subProductLimit}
                                                            onChange={(e) => setSubProductLimit(e.target.value)}
                                                        />
                                                        <span className="text-muted text-xs ml-2">Items allowed</span>
                                                    </div>
                                                </div>

                                                <div className="affected-stores">
                                                    <h4>Affected Shops:</h4>
                                                    <ul>
                                                        {stores.filter(st => st.owner_id === selectedSubSeller.id).map(st => (
                                                            <li key={st.id}>{st.name}</li>
                                                        ))}
                                                        {stores.filter(st => st.owner_id === selectedSubSeller.id).length === 0 && (
                                                            <li className="text-muted">No shops linked to this seller.</li>
                                                        )}
                                                    </ul>
                                                </div>

                                                <button 
                                                    className="btn-primary w-full mt-4"
                                                    disabled={stores.filter(st => st.owner_id === selectedSubSeller.id).length === 0}
                                                    onClick={async () => {
                                                        const sellerStores = stores.filter(st => st.owner_id === selectedSubSeller.id);
                                                        for (const store of sellerStores) {
                                                            await handleUpdateSubscription(store.id, subTier, subMonths, subProductLimit);
                                                        }
                                                        alert(`Successfully updated subscription for ${selectedSubSeller.username}`);
                                                        setSelectedSubSeller(null);
                                                    }}
                                                >
                                                    Apply Upgrade to All Shops
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="empty-action-state">
                                                <Users size={48} opacity={0.1} />
                                                <p>Select a seller from the left to begin the upgrade process.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="control-card limit-settings-card">
                                        <div className="card-header">
                                            <Package size={20} />
                                            <h3>Platform Limits</h3>
                                        </div>
                                        <p className="text-muted">Define how many products sellers can list by default.</p>
                                        <div className="limit-row mt-4">
                                            <span>Default Free Limit:</span>
                                            <input 
                                                type="number" 
                                                className="limit-input-sm"
                                                value={globalProductLimit}
                                                onChange={(e) => setGlobalProductLimit(e.target.value)}
                                            />
                                        </div>
                                        <button 
                                            className="btn-secondary w-full mt-2" 
                                            onClick={async () => {
                                                const freeStores = stores.filter(s => (s.subscription_tier || 'free') === 'free');
                                                let updatedCount = 0;
                                                for (const s of freeStores) {
                                                    try {
                                                        await supabase
                                                            .from('stores')
                                                            .update({ product_limit: globalProductLimit })
                                                            .eq('id', s.id);
                                                        updatedCount++;
                                                    } catch(e) {}
                                                }
                                                fetchAdminData();
                                                alert(`Updated product limit for ${updatedCount} free stores.`);
                                            }}
                                        >Apply to All Free Stores</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="locked-state">
                                    <Lock size={48} opacity={0.3} />
                                    <p>Subscription management is currently disabled. Toggle the switch above to enable access.</p>
                                </div>
                            )}
                        </section>
                    </div>
                ) : activeTab === 'categories' ? (
                    <div className="admin-categories-view-new">
                        <section className="admin-section">
                            <div className="section-header">
                                <div className="dual-header">
                                    <div className="title-group">
                                        <h2>Platform Hierarchy Management</h2>
                                        <p>Manage store category Sections and their child Sub-sections or home page visuals.</p>
                                    </div>
                                    <div className="header-actions">
                                        <div className="tab-toggle-group">
                                            <button 
                                                className={`tab-btn ${!isHomeCategoryTab ? 'active' : ''}`}
                                                onClick={() => setIsHomeCategoryTab(false)}
                                            >
                                                General Categories
                                            </button>
                                            <button 
                                                className={`tab-btn ${isHomeCategoryTab ? 'active' : ''}`}
                                                onClick={() => setIsHomeCategoryTab(true)}
                                            >
                                                Home Page Categories
                                            </button>
                                        </div>
                                        <button 
                                            className="btn-primary" 
                                            onClick={async () => {
                                                const { data, error } = await supabase.rpc('sync_legacy_categories');
                                                if (error) alert(error.message);
                                                else alert('Legacy categories synced.');
                                            }}
                                            title="Developer tool to sync data"
                                        >
                                            <Database size={16} /> Sync Legacy
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* CONDITIONAL CONTENT: HOME VS GENERAL */}
                            {isHomeCategoryTab ? (
                                <div className="home-category-management">
                                    <div className="info-banner">
                                        <ShieldAlert size={20} />
                                        <p>These are the 4 fixed categories shown on the Home Page row. You can change their images here.</p>
                                    </div>
                                    <div className="home-cat-grid">
                                        {homeCategories.map(cat => (
                                            <div key={cat.id} className="home-cat-card">
                                                <div 
                                                    className="home-cat-preview" 
                                                    onClick={() => document.getElementById(`home-img-${cat.id}`).click()}
                                                >
                                                    {cat.image_url ? (
                                                        <img src={cat.image_url} alt={cat.name} />
                                                    ) : (
                                                        <div className="placeholder">
                                                            <ShoppingBag size={32} opacity={0.2} />
                                                            <span>No Image</span>
                                                        </div>
                                                    )}
                                                    <div className="hover-overlay">
                                                        <Plus size={24} />
                                                        <span>Upload Image</span>
                                                    </div>
                                                </div>
                                                <input 
                                                    id={`home-img-${cat.id}`}
                                                    type="file"
                                                    accept="image/*"
                                                    hidden
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setCategoryUploading(true);
                                                            try {
                                                                const imgUrl = await uploadCategoryImage(file);
                                                                if (imgUrl) {
                                                                    const { error } = await supabase
                                                                        .from('home_page_categories')
                                                                        .update({ image_url: imgUrl })
                                                                        .eq('id', cat.id);
                                                                    if (error) throw error;
                                                                    fetchHomeCategories();
                                                                }
                                                            } catch (err) { alert(err.message); }
                                                            finally { setCategoryUploading(false); }
                                                        }
                                                    }}
                                                />
                                                <div className="home-cat-info">
                                                    <h4>{cat.name}</h4>
                                                    <p>Appears on Home Page</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="category-management-grid">
                                    {/* LEFT PANEL: SECTIONS */}
                                    <div className="management-panel sections-panel">
                                        <div className="panel-header">
                                            <h3>1. Category Sections</h3>
                                            <span className="count-badge">{sections.length}</span>
                                        </div>
                                        
                                        <div className="panel-form">
                                            <div className="cat-upload-wrapper">
                                                <div className="cat-upload-preview" onClick={() => document.getElementById('s-img').click()}>
                                                    {sectionPreview ? <img src={sectionPreview} alt="" /> : <span>🖼️</span>}
                                                </div>
                                                <input id="s-img" type="file" accept="image/*" hidden onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if(file) { setSectionFile(file); setSectionPreview(URL.createObjectURL(file)); }
                                                }} />
                                                <div className="cat-inputs">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Section Name" 
                                                        value={newSection.name}
                                                        onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                                                    />
                                                </div>
                                                <button className="btn-add-circle" disabled={categoryUploading} onClick={async () => {
                                                    if (!newSection.name) return;
                                                    setCategoryUploading(true);
                                                    try {
                                                        const imgUrl = await uploadCategoryImage(sectionFile);
                                                        const { error } = await supabase.from('category_sections').insert([{
                                                            name: newSection.name,
                                                            image_url: imgUrl
                                                        }]);
                                                        if (error) throw error;
                                                        setNewSection({ name: '' });
                                                        setSectionFile(null); setSectionPreview(null);
                                                        fetchSections();
                                                    } catch (e) { alert(e.message); }
                                                    finally { setCategoryUploading(false); }
                                                }}>{categoryUploading ? '...' : <Plus size={20} />}</button>
                                            </div>
                                        </div>

                                        <div className="panel-list">
                                            {sections.map(section => (
                                                <div 
                                                    key={section.id} 
                                                    className={`panel-item ${selectedSectionId === section.id ? 'active' : ''}`}
                                                    onClick={() => setSelectedSectionId(section.id)}
                                                >
                                                    {editingSectionId === section.id ? (
                                                        <div className="item-edit-form" onClick={(e) => e.stopPropagation()}>
                                                            <div className="edit-img-mini" onClick={() => document.getElementById(`edit-s-img-${section.id}`).click()}>
                                                                {editSectionPreview ? <img src={editSectionPreview} alt="" /> : <span className="item-icon-text">🖼️</span>}
                                                                <input 
                                                                    id={`edit-s-img-${section.id}`} 
                                                                    type="file" 
                                                                    accept="image/*" 
                                                                    hidden 
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if(file) { setEditSectionFile(file); setEditSectionPreview(URL.createObjectURL(file)); }
                                                                    }} 
                                                                />
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                className="edit-name-input"
                                                                value={editingSectionName}
                                                                onChange={(e) => setEditingSectionName(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <div className="edit-actions">
                                                                <button className="btn-save-sm" onClick={() => handleEditSaveSection(section.id)}><Check size={14} /></button>
                                                                <button className="btn-cancel-sm" onClick={() => setEditingSectionId(null)}><X size={14} /></button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="item-main">
                                                                <div className="item-img-mini">
                                                                    {section.image_url ? <img src={section.image_url} alt="" /> : <span className="item-icon-text">{section.icon || '📦'}</span>}
                                                                </div>
                                                                <span className="item-name">{section.name}</span>
                                                            </div>
                                                            <div className="item-actions">
                                                                <button className="item-edit" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingSectionId(section.id);
                                                                    setEditingSectionName(section.name);
                                                                    setEditSectionPreview(section.image_url);
                                                                    setEditSectionFile(null);
                                                                }}><Pencil size={14} /></button>
                                                                <button className="item-delete" onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!window.confirm(`Delete section "${section.name}" and all its sub-sections?`)) return;
                                                                    try {
                                                                        const { error } = await supabase.from('category_sections').delete().eq('id', section.id);
                                                                        if (error) throw error;
                                                                        fetchSections();
                                                                        if (selectedSectionId === section.id) setSelectedSectionId(null);
                                                                    } catch (err) { alert(err.message); }
                                                                }}><Trash2 size={14} /></button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* RIGHT PANEL: SUB-SECTIONS */}
                                    <div className="management-panel subsections-panel">
                                        <div className="panel-header">
                                            <h3>2. {sections.find(s => s.id === selectedSectionId)?.name || 'Select Section'} Sub-sections</h3>
                                            <span className="count-badge">{subsections.length}</span>
                                        </div>

                                        {selectedSectionId ? (
                                            <>
                                                <div className="panel-form">
                                                    <div className="cat-upload-wrapper">
                                                        <div className="cat-upload-preview" onClick={() => document.getElementById('sub-img').click()}>
                                                            {subsectionPreview ? <img src={subsectionPreview} alt="" /> : <span>🖼️</span>}
                                                        </div>
                                                        <input id="sub-img" type="file" accept="image/*" hidden onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if(file) { setSubsectionFile(file); setSubsectionPreview(URL.createObjectURL(file)); }
                                                        }} />
                                                        <div className="cat-inputs">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Sub-section Name" 
                                                                value={newSubsection.name}
                                                                onChange={(e) => setNewSubsection({ ...newSubsection, name: e.target.value })}
                                                            />
                                                        </div>
                                                        <button className="btn-add-circle" disabled={categoryUploading} onClick={async () => {
                                                            if (!newSubsection.name) return;
                                                            setCategoryUploading(true);
                                                            try {
                                                                const imgUrl = await uploadCategoryImage(subsectionFile);
                                                                const { error } = await supabase.from('category_subsections').insert([{
                                                                    name: newSubsection.name,
                                                                    section_id: selectedSectionId,
                                                                    image_url: imgUrl
                                                                }]);
                                                                if (error) throw error;
                                                                setNewSubsection({ name: '' });
                                                                setSubsectionFile(null); setSubsectionPreview(null);
                                                                fetchSubsections(selectedSectionId);
                                                            } catch (e) { alert(e.message); }
                                                            finally { setCategoryUploading(false); }
                                                        }}>{categoryUploading ? '...' : <Plus size={20} />}</button>
                                                    </div>
                                                </div>

                                                <div className="panel-list">
                                                    {subsections.length > 0 ? subsections.map(sub => (
                                                        <div key={sub.id} className="panel-item no-hover">
                                                            {editingSubsectionId === sub.id ? (
                                                                <div className="item-edit-form">
                                                                    <div className="edit-img-mini" onClick={() => document.getElementById(`edit-sub-img-${sub.id}`).click()}>
                                                                        {editSubsectionPreview ? <img src={editSubsectionPreview} alt="" /> : <span className="item-icon-text">🖼️</span>}
                                                                        <input 
                                                                            id={`edit-sub-img-${sub.id}`} 
                                                                            type="file" 
                                                                            accept="image/*" 
                                                                            hidden 
                                                                            onChange={(e) => {
                                                                                const file = e.target.files[0];
                                                                                if(file) { setEditSubsectionFile(file); setEditSubsectionPreview(URL.createObjectURL(file)); }
                                                                            }} 
                                                                        />
                                                                    </div>
                                                                    <input 
                                                                        type="text" 
                                                                        className="edit-name-input"
                                                                        value={editingSubsectionName}
                                                                        onChange={(e) => setEditingSubsectionName(e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                    <div className="edit-actions">
                                                                        <button className="btn-save-sm" onClick={() => handleEditSaveSubsection(sub.id)}><Check size={14} /></button>
                                                                        <button className="btn-cancel-sm" onClick={() => setEditingSubsectionId(null)}><X size={14} /></button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="item-main">
                                                                        <div className="item-img-mini">
                                                                            {sub.image_url ? <img src={sub.image_url} alt="" /> : <div className="dot"></div>}
                                                                        </div>
                                                                        <span className="item-name">{sub.name}</span>
                                                                    </div>
                                                                    <div className="item-actions">
                                                                        <button className="item-edit" onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingSubsectionId(sub.id);
                                                                            setEditingSubsectionName(sub.name);
                                                                            setEditSubsectionPreview(sub.image_url);
                                                                            setEditSubsectionFile(null);
                                                                        }}><Pencil size={14} /></button>
                                                                        <button className="item-delete" onClick={async () => {
                                                                            if (!window.confirm(`Delete sub-section "${sub.name}"?`)) return;
                                                                            try {
                                                                                const { error } = await supabase.from('category_subsections').delete().eq('id', sub.id);
                                                                                if (error) throw error;
                                                                                fetchSubsections(selectedSectionId);
                                                                            } catch (err) { alert(err.message); }
                                                                        }}><Trash2 size={14} /></button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )) : (
                                                        <div className="empty-panel-state">
                                                            <Database size={40} opacity={0.1} />
                                                            <p>No sub-sections found for this section.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="empty-panel-state central">
                                                <ChevronLeft size={48} opacity={0.2} />
                                                <p>Select a category section from the left to manage its sub-sections.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
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

            {showProductModal && (
                <div className="modal-overlay">
                    <div className="modal-card product-modal">
                        <div className="modal-header">
                            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button className="close-btn" onClick={() => setShowProductModal(false)}><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleProductSubmit} className="product-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={productForm.name}
                                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category (Sub-section)</label>
                                    <select 
                                        required 
                                        value={productForm.category}
                                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                                    >
                                        <option value="">Select Category</option>
                                        {/* New Hierarchy */}
                                        {sections.map(section => (
                                            <optgroup key={section.id} label={section.name}>
                                                {subsections.filter(sub => sub.section_id === section.id).map(sub => (
                                                    <option key={sub.id} value={sub.name}>
                                                        {sub.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                        {/* Legacy Fallback if needed */}
                                        {sections.length === 0 && categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>
                                                {cat.parent_id ? '└ ' : ''}{cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Online Price (₹)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={productForm.online_price}
                                        onChange={(e) => setProductForm({...productForm, online_price: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Market Price (₹)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={productForm.market_price}
                                        onChange={(e) => setProductForm({...productForm, market_price: e.target.value})}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea 
                                        rows="3"
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label>Stock Status</label>
                                    <select 
                                        value={productForm.stock_status}
                                        onChange={(e) => setProductForm({...productForm, stock_status: e.target.value})}
                                    >
                                        <option value="in_stock">In Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Delivery Type</label>
                                    <select 
                                        value={productForm.delivery_type}
                                        onChange={(e) => setProductForm({...productForm, delivery_type: e.target.value})}
                                    >
                                        <option value="express">Express (Fast)</option>
                                        <option value="standard">Standard</option>
                                    </select>
                                </div>
                            </div>

                            <div className="image-upload-section">
                                <label>Product Gallery</label>
                                <div className="image-previews">
                                    {productPreviews.map((url, index) => (
                                        <div key={index} className="preview-item">
                                            <img src={url} alt="Preview" />
                                            <button 
                                                type="button" 
                                                className="remove-img"
                                                onClick={() => {
                                                    const newPreviews = productPreviews.filter((_, i) => i !== index);
                                                    setProductPreviews(newPreviews);
                                                    if (index < productForm.images.length) {
                                                        const newImages = productForm.images.filter((_, i) => i !== index);
                                                        setProductForm({...productForm, images: newImages});
                                                    } else {
                                                        const newFileImages = productImages.filter((_, i) => i !== (index - productForm.images.length));
                                                        setProductImages(newFileImages);
                                                    }
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="add-image-btn">
                                        <Plus size={24} />
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*" 
                                            hidden 
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files);
                                                setProductImages([...productImages, ...files]);
                                                const newPreviews = files.map(file => URL.createObjectURL(file));
                                                setProductPreviews([...productPreviews, ...newPreviews]);
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={uploading}>
                                    {uploading ? 'Processing...' : (editingProduct ? 'Update Product' : 'Create Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
