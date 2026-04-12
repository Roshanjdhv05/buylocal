import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTranslation } from 'react-i18next';
import AddProduct from './AddProduct';
import {
    Plus, Edit2, Trash2, Package, ShoppingCart,
    ChevronRight, TrendingUp, AlertCircle, Check,
    Upload, X, Image as ImageIcon, Settings,
    Archive, DollarSign, LogOut, User, Home,
    LayoutDashboard, BarChart, ShoppingBag, PlusCircle, ExternalLink, Edit, Clock, Truck,
    Filter, MoreHorizontal, ChevronLeft, Search, MapPin, Zap, Menu, BookOpen,
    Megaphone, Calendar, Play, Pause, Trash, Copy, Video, PlayCircle
} from 'lucide-react';
import './DashboardStyles.css';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import InvoiceModal from '../../components/InvoiceModal';
import { clearPageCache } from '../../utils/pageCache';

const SellerDashboard = () => {
    const { t } = useTranslation();
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
        profile_picture_url: '', location_url: '', gst_number: '',
        delivery_charges: '50', free_delivery_threshold: '500',
        video_urls: []
    });
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
    const [sections, setSections] = useState([]);
    const [legacyImageUploading, setLegacyImageUploading] = useState(false);
    const [profilePictureUploading, setProfilePictureUploading] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [campaigns, setCampaigns] = useState([]);
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
    const [campaignFormData, setCampaignFormData] = useState({
        banner_image: null,
        mobile_banner_image: null,
        duration_days: '7',
        continuous: false
    });
    const [campaignPreview, setCampaignPreview] = useState(null);
    const [campaignMobilePreview, setCampaignMobilePreview] = useState(null);
    const [customCategories, setCustomCategories] = useState([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', image: null });
    const [categoryPreview, setCategoryPreview] = useState(null);
    const [categoryUploading, setCategoryUploading] = useState(false);
    const [newHighlight, setNewHighlight] = useState('');

    // Product filter states
    const [productSearch, setProductSearch] = useState('');
    const [productCategoryFilter, setProductCategoryFilter] = useState('all');
    const [productSortOrder, setProductSortOrder] = useState('newest');
    const [productStockFilter, setProductStockFilter] = useState('all');

    // Order filter states
    const [orderStatusTab, setOrderStatusTab] = useState('all');
    const [orderSearch, setOrderSearch] = useState('');
    const [orderDateFilter, setOrderDateFilter] = useState('all');

    const calculateDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

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
        delivery_time: '2-3 days',
        tags: []
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
                    gst_number: storeData.gst_number || '',
                    free_delivery: storeData.free_delivery || false,
                    cod_available: storeData.cod_available ?? true,
                    custom_highlights: Array.isArray(storeData.custom_highlights) ? storeData.custom_highlights : [],
                    delivery_charges: storeData.delivery_charges || '50',
                    free_delivery_threshold: storeData.free_delivery_threshold || '',
                    video_urls: Array.isArray(storeData.video_urls) ? storeData.video_urls : []
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

                // Fetch Campaigns
                try {
                    const { data: campaignsData } = await withTimeout(supabase
                        .from('banner_campaigns')
                        .select('*')
                        .eq('store_id', storeData.id)
                        .order('created_at', { ascending: false }));
                    setCampaigns(campaignsData || []);
                } catch (err) {
                    console.warn('Dashboard: Campaigns fetch failed:', err.message);
                }

                // Fetch Custom Categories
                try {
                    const { data: catData } = await withTimeout(supabase
                        .from('store_custom_categories')
                        .select('*')
                        .eq('store_id', storeData.id)
                        .order('display_order', { ascending: true }));
                    setCustomCategories(catData || []);
                } catch (err) {
                    console.warn('Dashboard: Custom categories fetch failed:', err.message);
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

    const analyticsData = React.useMemo(() => {
        const productStats = {};
        orders.forEach(order => {
            order.items?.forEach(item => {
                const id = item.id || item.productId || item.name;
                if (!productStats[id]) {
                    productStats[id] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0,
                        image: item.images?.[0] || item.image
                    };
                }
                const qty = Number(item.quantity) || 1;
                const price = Number(item.online_price || item.price) || 0;
                productStats[id].quantity += qty;
                productStats[id].revenue += qty * price;
            });
        });
        const statsArray = Object.values(productStats);
        return {
            mostSelling: [...statsArray].sort((a, b) => b.quantity - a.quantity),
            lessSelling: [...statsArray].sort((a, b) => a.quantity - b.quantity)
        };
    }, [orders]);

    const productIdMap = React.useMemo(() => {
        const map = {};
        const sortedProducts = [...products].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        sortedProducts.forEach((p, idx) => {
            map[p.id] = `PRD-${idx + 1}`;
        });
        return map;
    }, [products]);

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
        if (!productData.id && products.length >= (store?.product_limit || 50)) {
            alert(`Limit reached: Each store can have a maximum of ${store?.product_limit || 50} products.`);
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
                images: imageUrls,
                tags: productData.tags || [],
                stock_quantity: productData.trackStock ? parseInt(productData.stock || 0) : null
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

            clearPageCache(); // Clear draft/state after successful submission
            setIsAddingProduct(false);
            setEditingProduct(null);
            setNewProduct({
                name: '', category: '', section: '', online_price: '', offline_price: '',
                description: '', sizes: [], age_group: 'Adults',
                cod_available: true, delivery_time: '1-2 days',
                tags: [],
                stock: '0'
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
            // 1. Update order status
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // 2. Decrement stock if order is accepted
            if (newStatus === 'accepted') {
                const order = orders.find(o => o.id === orderId);
                if (order && order.items) {
                    for (const item of order.items) {
                        const productId = item.id;
                        const quantity = item.quantity || 1;

                        try {
                            // Fetch current stock
                            const { data: productData, error: fetchError } = await supabase
                                .from('products')
                                .select('stock_quantity')
                                .eq('id', productId)
                                .single();

                            if (fetchError) {
                                console.error(`Error fetching stock for product ${productId}:`, fetchError.message);
                                continue;
                            }

                            if (productData && productData.stock_quantity !== null) {
                                const currentStock = productData.stock_quantity || 0;
                                const newStock = Math.max(0, currentStock - quantity);

                                // Update stock
                                const { error: updateError } = await supabase
                                    .from('products')
                                    .update({ stock_quantity: newStock })
                                    .eq('id', productId);

                                if (updateError) {
                                    console.error(`Error updating stock for product ${productId}:`, updateError.message);
                                }
                            }
                        } catch (stockErr) {
                            console.error(`Unexpected error updating stock for product ${productId}:`, stockErr.message);
                        }
                    }
                    // Refresh products to show updated stock in dashboard
                    fetchStoreData();
                }
            }

            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error('Error updating order status:', error.message);
            alert(error.message);
        }
    };

    const handleUpdateStore = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            console.log('Pushing Store Update:', editedStore);
            const { error } = await supabase
                .from('stores')
                .update(editedStore)
                .eq('id', store.id);

            if (error) throw error;
            setStore({ ...store, ...editedStore });
            setIsEditingStore(false);
            clearPageCache();
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
        if (!window.confirm('Remove this image from gallery?')) return;
        try {
            const updatedGallery = (store.gallery_urls || []).filter(url => url !== urlToDelete);
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

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Restriction: Only 2 videos per store
        const currentVideos = editedStore.video_urls || store?.video_urls || [];
        if (currentVideos.length >= 2) {
            alert('You can only add up to 2 videos per store.');
            return;
        }

        // Basic size validation (e.g., 20MB)
        if (file.size > 20 * 1024 * 1024) {
            alert('Video file size must be less than 20MB.');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `videos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('store-gallery')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('store-gallery')
                .getPublicUrl(filePath);

            const updatedVideos = [...currentVideos, publicUrl];
            
            // Update local state and DB immediately for videos
            const { error: updateError } = await supabase
                .from('stores')
                .update({ video_urls: updatedVideos })
                .eq('id', store.id);

            if (updateError) throw updateError;
            
            setStore({ ...store, video_urls: updatedVideos });
            setEditedStore(prev => ({ ...prev, video_urls: updatedVideos }));
            alert('Video uploaded successfully!');
        } catch (error) {
            alert('Video upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteVideo = async (urlToDelete) => {
        if (!window.confirm('Delete this video?')) return;
        try {
            const currentVideos = editedStore.video_urls || store?.video_urls || [];
            const updatedVideos = currentVideos.filter(url => url !== urlToDelete);
            
            const { error } = await supabase
                .from('stores')
                .update({ video_urls: updatedVideos })
                .eq('id', store.id);
            
            if (error) throw error;
            
            setStore({ ...store, video_urls: updatedVideos });
            setEditedStore(prev => ({ ...prev, video_urls: updatedVideos }));
        } catch (error) {
            alert(error.message);
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



    const handleCampaignImageChange = (e, type = 'desktop') => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'desktop') {
                setCampaignFormData(prev => ({ ...prev, banner_image: file }));
                setCampaignPreview(URL.createObjectURL(file));
            } else {
                setCampaignFormData(prev => ({ ...prev, mobile_banner_image: file }));
                setCampaignMobilePreview(URL.createObjectURL(file));
            }
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        if (!(campaignFormData.banner_image || campaignFormData.mobile_banner_image) || !store) {
            alert('Please upload at least one banner image (Desktop or Phone).');
            return;
        }

        setUploading(true);
        try {
            console.log('Campaign: Starting creation process...');
            // 1. Upload Desktop Banner
            let desktopUrl = null;
            if (campaignFormData.banner_image) {
                const dFile = campaignFormData.banner_image;
                const dExt = dFile.name.split('.').pop();
                const dName = `campaign_desktop_${Math.random()}.${dExt}`;
                const dPath = `campaigns/${profile.id}/${dName}`;

                console.log('Campaign: Uploading desktop banner...');
                const { error: dUploadError } = await supabase.storage
                    .from('store-gallery')
                    .upload(dPath, dFile);

                if (dUploadError) {
                    console.error('Campaign: Desktop upload error:', dUploadError);
                    throw new Error(`Desktop banner upload failed: ${dUploadError.message}`);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('store-gallery')
                    .getPublicUrl(dPath);
                
                desktopUrl = publicUrl;
            }

            // 2. Upload Mobile Banner (Optional)
            let mobileUrl = null;
            if (campaignFormData.mobile_banner_image) {
                const mFile = campaignFormData.mobile_banner_image;
                const mExt = mFile.name.split('.').pop();
                const mName = `campaign_mobile_${Math.random()}.${mExt}`;
                const mPath = `campaigns/${profile.id}/${mName}`;

                console.log('Campaign: Uploading mobile banner...');
                const { error: mUploadError } = await supabase.storage
                    .from('store-gallery')
                    .upload(mPath, mFile);

                if (mUploadError) {
                    console.error('Campaign: Mobile upload error:', mUploadError);
                    throw new Error(`Mobile banner upload failed: ${mUploadError.message}`);
                }

                const { data: { publicUrl: mUrl } } = supabase.storage
                    .from('store-gallery')
                    .getPublicUrl(mPath);
                
                mobileUrl = mUrl;
            }

            // 3. Calculate end date
            let endDate = null;
            if (!campaignFormData.continuous) {
                const days = parseInt(campaignFormData.duration_days);
                endDate = new Date();
                endDate.setDate(endDate.getDate() + days);
            }

            // 4. Create Record
            console.log('Campaign: Inserting record into banner_campaigns...');
            const { data, error } = await supabase
                .from('banner_campaigns')
                .insert([{
                    store_id: store.id,
                    banner_url: desktopUrl,
                    mobile_banner_url: mobileUrl,
                    end_date: endDate,
                    is_active: true
                }])
                .select();

            if (error) {
                console.error('Campaign: DB Insert error:', error);
                throw error;
            }

            console.log('Campaign: Created successfully!', data);
            setCampaigns([data[0], ...campaigns]);
            setIsCreatingCampaign(false);
            setCampaignFormData({ banner_image: null, mobile_banner_image: null, duration_days: '7', continuous: false });
            setCampaignPreview(null);
            setCampaignMobilePreview(null);
            alert('Campaign created successfully! It is now active on the home page.');
        } catch (error) {
            console.error('Campaign Creation Error:', error);
            alert('Error creating campaign: ' + (error.details || error.message || 'Unknown error'));
        } finally {
            setUploading(false);
        }

    };

    const toggleCampaignStatus = async (campaign) => {
        try {
            const { error } = await supabase
                .from('banner_campaigns')
                .update({ is_active: !campaign.is_active })
                .eq('id', campaign.id);

            if (error) throw error;
            setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, is_active: !c.is_active } : c));
        } catch (error) {
            alert(error.message);
        }
    };

    const deleteCampaign = async (campaignId) => {
        if (!window.confirm('Are you sure you want to delete this campaign?')) return;
        try {
            const { error } = await supabase
                .from('banner_campaigns')
                .delete()
                .eq('id', campaignId);

            if (error) throw error;
            setCampaigns(campaigns.filter(c => c.id !== campaignId));
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

    const handleAddHighlight = () => {
        if (!newHighlight.trim()) return;
        setEditedStore(prev => {
            const currentHighlights = Array.isArray(prev.custom_highlights) ? prev.custom_highlights : [];
            if (currentHighlights.includes(newHighlight.trim())) {
                alert('This highlight already exists.');
                return prev;
            }
            return {
                ...prev,
                custom_highlights: [...currentHighlights, newHighlight.trim()]
            };
        });
        setNewHighlight('');
    };

    const handleRemoveHighlight = (item) => {
        setEditedStore(prev => ({
            ...prev,
            custom_highlights: (Array.isArray(prev.custom_highlights) ? prev.custom_highlights : []).filter(h => h !== item)
        }));
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.name || !newCategory.image || !store) return;

        setCategoryUploading(true);
        try {
            const url = await uploadImage(newCategory.image);
            const { data, error } = await supabase
                .from('store_custom_categories')
                .insert([{
                    store_id: store.id,
                    name: newCategory.name,
                    image_url: url,
                    display_order: customCategories.length
                }])
                .select();

            if (error) throw error;
            setCustomCategories([...customCategories, data[0]]);
            setIsAddingCategory(false);
            setNewCategory({ name: '', image: null });
            setCategoryPreview(null);
            alert('Category added successfully!');
        } catch (err) {
            alert('Error creating category: ' + err.message);
        } finally {
            setCategoryUploading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            const { error } = await supabase
                .from('store_custom_categories')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setCustomCategories(customCategories.filter(c => c.id !== id));
        } catch (err) {
            alert('Error deleting category: ' + err.message);
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

    if (loading) return <LoadingSpinner fullPage />;

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
                    <button onClick={() => { setActiveTab('marketing'); setIsMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'marketing' ? 'active' : ''}`}>
                        <Megaphone size={18} /> <span>{t('nav.marketing')}</span>
                    </button>
                    <button onClick={() => { setActiveTab('categories'); setIsMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}>
                        <Filter size={18} /> <span>Store Categories</span>
                    </button>
                    <button onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
                        <Settings size={18} /> <span>Store Settings</span>
                    </button>
                    <button 
                        onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }} 
                        className={`nav-item nav-analytics ${activeTab === 'analytics' ? 'active' : ''}`}
                    >
                        <BarChart size={18} /> <span>Analytics</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className={`pro-card ${store?.subscription_tier === 'premium' ? 'premium' : ''}`}>
                        <div className="pro-label">PLAN: {store?.subscription_tier === 'premium' ? 'PREMIUM' : 'FREE'}</div>
                        <p className="pro-text">
                            {store?.subscription_tier === 'premium' ? (
                                <>Valid until {formatDate(store.subscription_end_date)} ({calculateDaysRemaining(store.subscription_end_date)} days left)</>
                            ) : (
                                <>Upgrade to list more products and reach more customers.</>
                            )}
                        </p>
                        <button className="btn-upgrade" onClick={() => navigate('/seller/subscription')}>
                            {store?.subscription_tier === 'premium' ? 'Manage Plan' : 'Upgrade Plan'}
                        </button>
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
                        customCategories={customCategories}
                        defaultDeliveryCharges={store?.delivery_charges}
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
                                {store?.subscription_tier === 'premium' && (
                                    <div className="header-badge premium-timer">
                                        <Zap size={14} fill="currentColor" />
                                        <span>Premium until {formatDate(store.subscription_end_date)} ({calculateDaysRemaining(store.subscription_end_date)} days left)</span>
                                    </div>
                                )}
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
                                            <div className="stat-icon-wrapper bg-green"><TrendingUp size={18} /></div>
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
                                                        <th>ITEMS</th>
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
                                                                {order.display_id ? `#${order.display_id}` : `#ORD-${order.id.substring(0, 6).toUpperCase()}`}
                                                                <span className="order-date-span">{new Date(order.created_at).toLocaleString()}</span>
                                                            </td>
                                                            <td data-label="Items">
                                                                <div className="order-item-thumbnails">
                                                                    {order.items?.slice(0, 3).map((item, i) => (
                                                                        <img
                                                                            key={i}
                                                                            src={item.images?.[0] || item.image || '/placeholder-product.png'}
                                                                            alt={item.name}
                                                                            className="mini-thumb"
                                                                            title={item.name}
                                                                        />
                                                                    ))}
                                                                    {order.items?.length > 3 && (
                                                                        <span className="more-items-badge">+{order.items.length - 3}</span>
                                                                    )}
                                                                </div>
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
                                                    className={`btn-action-primary ${products.length >= (store?.product_limit || 50) ? 'disabled' : ''}`}
                                                    onClick={() => {
                                                        if (products.length >= (store?.product_limit || 50)) {
                                                            alert(`Product limit reached (${products.length}/${store?.product_limit || 50}).`);
                                                        } else {
                                                            setIsAddingProduct(true);
                                                        }
                                                    }}
                                                    disabled={products.length >= (store?.product_limit || 50)}
                                                >
                                                    <PlusCircle size={18} /> Add Product ({products.length}/${store?.product_limit || 50})
                                                </button>
                                                <button className="btn-action-white" onClick={() => setActiveTab('settings')}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Edit size={16} /> Edit Store</span>
                                                    <ChevronRight size={16} />
                                                </button>
                                                <Link to={`/${encodeURIComponent(store?.name)}`} className="btn-action-white" target="_blank">

                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ExternalLink size={16} /> View Store Page</span>
                                                    <ChevronRight size={16} />
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="boost-card">
                                            <h3 className="boost-title">{t('marketing.boostTitle')}</h3>
                                            <p className="boost-desc">{t('marketing.boostDesc')}</p>
                                            <button className="btn-boost" onClick={() => setActiveTab('marketing')}>{t('marketing.createNew')}</button>
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
                                        className={`btn-add-product ${products.length >= (store?.product_limit || 50) ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (products.length >= (store?.product_limit || 50)) {
                                                alert(`Product limit reached (${products.length}/${store?.product_limit || 50}).`);
                                            } else {
                                                setIsAddingProduct(true);
                                            }
                                        }}
                                        disabled={products.length >= (store?.product_limit || 50)}
                                    >
                                        <Plus size={20} /> Add Product ({products.length}/${store?.product_limit || 50})
                                    </button>
                                </div>                                {/* Toolbar */}
                                <div className="products-toolbar">
                                    <div className="toolbar-left">
                                        <div className="search-wrapper" style={{ position: 'relative' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input
                                                type="text"
                                                placeholder="Search products..."
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                                style={{ paddingLeft: '34px', width: '220px', height: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="toolbar-right">
                                        <select
                                            className="filter-dropdown-btn"
                                            value={productCategoryFilter}
                                            onChange={(e) => setProductCategoryFilter(e.target.value)}
                                            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: '600', color: '#475569', background: '#fff', cursor: 'pointer' }}
                                        >
                                            <option value="all">All Categories</option>
                                            {[...new Set(products.map(p => p.category).filter(Boolean))].map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="filter-dropdown-btn"
                                            value={productStockFilter}
                                            onChange={(e) => setProductStockFilter(e.target.value)}
                                            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: '600', color: '#475569', background: '#fff', cursor: 'pointer' }}
                                        >
                                            <option value="all">All Stock</option>
                                            <option value="in-stock">In Stock</option>
                                            <option value="out-of-stock">Out of Stock</option>
                                        </select>
                                        <select
                                            className="filter-dropdown-btn"
                                            value={productSortOrder}
                                            onChange={(e) => setProductSortOrder(e.target.value)}
                                            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: '600', color: '#475569', background: '#fff', cursor: 'pointer' }}
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                            <option value="price-asc">Price: Low to High</option>
                                            <option value="price-desc">Price: High to Low</option>
                                            <option value="name-asc">Name: A-Z</option>
                                            <option value="name-desc">Name: Z-A</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Filtered Products Grid */}
                                {(() => {
                                    // 1. Filter
                                    let filtered = [...products];

                                    // Search filter
                                    if (productSearch.trim()) {
                                        const q = productSearch.toLowerCase().trim();
                                        filtered = filtered.filter(p =>
                                            p.name?.toLowerCase().includes(q) ||
                                            p.category?.toLowerCase().includes(q) ||
                                            p.section?.toLowerCase().includes(q) ||
                                            p.tags?.some(t => t.toLowerCase().includes(q))
                                        );
                                    }

                                    // Category filter
                                    if (productCategoryFilter !== 'all') {
                                        filtered = filtered.filter(p => p.category === productCategoryFilter);
                                    }

                                    // Stock filter
                                    if (productStockFilter === 'in-stock') {
                                        filtered = filtered.filter(p => p.stock_quantity === null || (p.stock_quantity || 0) > 0);
                                    } else if (productStockFilter === 'out-of-stock') {
                                        filtered = filtered.filter(p => p.stock_quantity !== null && (p.stock_quantity || 0) <= 0);
                                    }

                                    // 2. Sort
                                    filtered.sort((a, b) => {
                                        switch (productSortOrder) {
                                            case 'newest': return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                                            case 'oldest': return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                                            case 'price-asc': return (a.online_price || 0) - (b.online_price || 0);
                                            case 'price-desc': return (b.online_price || 0) - (a.online_price || 0);
                                            case 'name-asc': return (a.name || '').localeCompare(b.name || '');
                                            case 'name-desc': return (b.name || '').localeCompare(a.name || '');
                                            default: return 0;
                                        }
                                    });

                                    return (
                                        <>
                                            {/* Results count */}
                                            <div style={{ padding: '0.5rem 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>
                                                Showing {filtered.length} of {products.length} products
                                                {productSearch && <span> matching "{productSearch}"</span>}
                                            </div>

                                            <div className="products-grid-pro">
                                                {filtered.map(product => (
                                                    <div key={product.id} className="product-card-pro">
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
                                                              <span className={`status-dot ${(product.stock_quantity !== null && (product.stock_quantity || 0) <= 0) ? 'out-of-stock' : ''}`}>
                                                                <span className="dot"></span> <span className="status-text">{(product.stock_quantity === null || (product.stock_quantity || 0) > 0) ? 'Active' : 'Out of Stock'}</span>
                                                            </span>
                                                            <span className="product-id-pill">#{productIdMap[product.id] || `PRD-${product.id?.slice(0, 6).toUpperCase()}`}</span>
                                                        </div>
                                                        <h3 className="pro-card-name" title={product.name}>{product.name}</h3>
                                                        {product.tags && product.tags.length > 0 && (
                                                            <div className="pro-card-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                                                {product.tags.slice(0, 3).map((tag, i) => (
                                                                    <span key={i} style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#64748b' }}>
                                                                        #{tag}
                                                                    </span>
                                                                ))}
                                                                {product.tags.length > 3 && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>+{product.tags.length - 3}</span>}
                                                            </div>
                                                        )}
                                                        <div className="pro-card-footer">
                                                            <span className="pro-price">₹{product.online_price}</span>
                                                            <span className="pro-stock">{product.stock_quantity !== null ? `${product.stock_quantity} in stock` : 'Infinite stock'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {filtered.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                                                    <Package size={40} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                                                    <p style={{ fontWeight: '600' }}>No products match your filters</p>
                                                    <button onClick={() => { setProductSearch(''); setProductCategoryFilter('all'); setProductStockFilter('all'); setProductSortOrder('newest'); }}
                                                        style={{ marginTop: '0.75rem', background: '#6366f1', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                        Clear All Filters
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                            </div>
                        )} { /* End of Products Tab */}

                        {activeTab === 'orders' && (
                            <div className="orders-tab-pro">
                                <div className="product-page-header">
                                    <div className="page-title">
                                        <h2>Order Management</h2>
                                        <p>Track and manage your customer orders.</p>
                                    </div>
                                    <div className="toolbar-right">
                                        <div className="search-bar-pro" style={{ background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #e2e8f0' }}>
                                            <Search size={16} color="#94a3b8" />
                                            <input 
                                                type="text" 
                                                placeholder="Search orders..." 
                                                value={orderSearch}
                                                onChange={(e) => setOrderSearch(e.target.value)}
                                                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                    {['all', 'pending', 'accepted', 'dispatched', 'delivered', 'cancelled', 'rejected'].map(status => (
                                        <button 
                                            key={status}
                                            onClick={() => setOrderStatusTab(status)}
                                            style={{
                                                padding: '0.5rem 1rem', 
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                borderColor: orderStatusTab === status ? '#6366f1' : '#e2e8f0',
                                                background: orderStatusTab === status ? '#f5f3ff' : 'white',
                                                color: orderStatusTab === status ? '#4f46e5' : '#64748b',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                textTransform: 'capitalize',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {status} {status !== 'all' && (
                                                <span style={{ marginLeft: '4px', background: orderStatusTab === status ? '#c7d2fe' : '#f1f5f9', color: orderStatusTab === status ? '#4338ca' : '#64748b', borderRadius: '99px', padding: '0 6px', fontSize: '0.7rem', fontWeight: '700' }}>
                                                    {orders.filter(o => o.status === status).length}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {(() => {
                                    let filtered = [...orders];
                                    if (orderStatusTab !== 'all') {
                                        filtered = filtered.filter(o => o.status === orderStatusTab);
                                    }
                                    if (orderSearch.trim()) {
                                        const q = orderSearch.toLowerCase().trim();
                                        filtered = filtered.filter(o => 
                                            o.id?.toLowerCase().includes(q) ||
                                            o.buyer?.username?.toLowerCase().includes(q) ||
                                            o.buyer?.email?.toLowerCase().includes(q)
                                        );
                                    }
                                    
                                    return (
                                        <div className="orders-grid-pro" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {filtered.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', background: 'white', borderRadius: '12px' }}>
                                                    <Package size={40} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                                                    <p style={{ fontWeight: '600' }}>No orders found.</p>
                                                </div>
                                            ) : (
                                                filtered.map(order => {
                                                    const getTimeAgo = (dateStr) => {
                                                        if (!dateStr) return '';
                                                        const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
                                                        if (diff < 1) return 'Just now';
                                                        if (diff < 60) return `${diff}m ago`;
                                                        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
                                                        return `${Math.floor(diff / 1440)}d ago`;
                                                    };

                                                    return (
                                                    <div key={order.id} className="so-card">
                                                        {/* Header Part */}
                                                        <div className="so-header-row">
                                                            <div className="so-header-left">
                                                                <div className="so-id-row">
                                                                    <span className="so-id">{order.display_id ? `#${order.display_id}` : `#ORD-${order.id?.substring(0,6).toUpperCase()}`}</span>
                                                                    <span className={`so-badge so-badge-${order.status || 'new'}`}>
                                                                    {
                                                                        order.status === 'pending' ? 'NEW' :
                                                                        order.status === 'cancelled' ? 'CANCELLED' :
                                                                        order.status === 'rejected' ? 'REJECTED' :
                                                                        order.status
                                                                    }
                                                                </span>
                                                                </div>
                                                                <div className="so-time-row">
                                                                    <Clock size={14} color="#6b7280" />
                                                                    <span className="so-time">{getTimeAgo(order.created_at)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="so-header-right">
                                                                <span className="so-price">₹{order.total_amount}</span>
                                                                <span className="so-payment-status">{order.payment_mode === 'cash_on_delivery' ? 'COD' : 'PREPAID'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Items Container */}
                                                        <div className="so-items-container">
                                                            {order.items?.map((item, i) => (
                                                                <div key={i} className="so-item-row">
                                                                     <div className="so-item-icon">
                                                                         {(item.image || item.image_url || (item.images && item.images[0])) ? (
                                                                             <img 
                                                                                 src={item.image || item.image_url || item.images[0]} 
                                                                                 alt={item.name} 
                                                                                 className="so-item-img"
                                                                             />
                                                                         ) : (
                                                                             <Package size={20} color="#6d28d9" strokeWidth={2.5} />
                                                                         )}
                                                                     </div>
                                                                    <div className="so-item-details">
                                                                        <h4 className="so-item-name">{item.name}</h4>
                                                                        <p className="so-item-meta">
                                                                            ID: #{productIdMap[item.id || item.product_id] || `PRD-${(item.id || item.product_id)?.slice(0, 6).toUpperCase() || 'N/A'}`} • Qty: {item.quantity}{item.size ? ` • Size: ${item.size}` : ''}
                                                                        </p>
                                                                    </div>
                                                                    <div className="so-item-price" style={{ display: 'none' }}>
                                                                        ₹{Number(item.online_price || item.price || 0) * (item.quantity || 1)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Customer Avatar Row */}
                                                        <div className="so-customer-row">
                                                            <img 
                                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(order.buyer?.username || 'Guest')}&background=1e293b&color=fff&bold=true`} 
                                                                alt="Customer" 
                                                                className="so-customer-avatar"
                                                            />
                                                            <span className="so-customer-name">{order.buyer?.username || 'Guest'}</span>
                                                        </div>

                                                        {/* Bottom Actions */}
                                                        <div className="so-actions-row">
                                                            <button
                                                                className="btn-so-secondary"
                                                                onClick={() => { setSelectedOrderForInvoice(order); setIsInvoiceModalOpen(true); }}
                                                            >
                                                                <BookOpen size={15} /> Invoice
                                                            </button>

                                                            {order.status === 'pending' && (
                                                                <div className="so-action-stack-mobile">
                                                                    <button className="btn-so-primary" onClick={() => updateOrderStatus(order.id, 'accepted')}>
                                                                        Accept Order
                                                                    </button>
                                                                    <button className="btn-so-secondary" onClick={() => updateOrderStatus(order.id, 'rejected')}>
                                                                        Reject Order
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {order.status === 'accepted' && (
                                                                <button className="btn-so-primary" onClick={() => updateOrderStatus(order.id, 'dispatched')}>
                                                                    Dispatch Order
                                                                </button>
                                                            )}
                                                            {order.status === 'dispatched' && (
                                                                <button className="btn-so-primary" onClick={() => updateOrderStatus(order.id, 'delivered')}>
                                                                    Mark Delivered
                                                                </button>
                                                            )}
                                                            {order.status === 'delivered' && (
                                                                <span className="btn-so-completed">✅ Completed</span>
                                                            )}
                                                            {(order.status === 'cancelled' || order.status === 'rejected') && (
                                                                <span className="btn-so-cancelled">
                                                                    {order.status === 'cancelled' ? '❌ Cancelled by Buyer' : '❌ Rejected'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )})
                                        )}
                                    </div>
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'marketing' && (
                            <div className="marketing-tab-pro">
                                <div className="orders-page-header">
                                    <div className="header-text">
                                        <h2>{t('marketing.title')}</h2>
                                        <p style={{ color: 'var(--text-muted)' }}>{t('marketing.subtitle')}</p>
                                    </div>
                                    <button className="btn-save-all" onClick={() => setIsCreatingCampaign(true)}>
                                        <PlusCircle size={18} fill="white" style={{ marginRight: '8px' }} /> {t('marketing.createNew')}
                                    </button>
                                </div>

                                {isCreatingCampaign && (
                                    <div className="settings-card-pro campaign-form-card">
                                        <div className="card-header-pro">
                                            <div className="card-icon"><Plus size={24} /></div>
                                            <h3>{t('marketing.newHeroBanner')}</h3>
                                            <button className="close-form-btn" onClick={() => setIsCreatingCampaign(false)}><X size={20} /></button>
                                        </div>

                                        <form onSubmit={handleCreateCampaign} className="campaign-form">
                                            <div className="form-sections-grid">
                                                <div className="form-full-width">
                                                    <div className="banner-upload-flex-pro">
                                                        <div className="settings-input-group flex-1">
                                                            <label className="settings-label">Laptop Screen Banner (Desktop)</label>
                                                            <label className="campaign-upload-zone-pro">
                                                                {campaignPreview ? (
                                                                    <img src={campaignPreview} alt="Desktop Preview" className="campaign-preview-img-pro" />
                                                                ) : (
                                                                    <div className="upload-placeholder">
                                                                        <ImageIcon size={32} />
                                                                        <p>{t('marketing.uploadPlaceholder')}</p>
                                                                        <span className="dimension-label">1600 x 500px</span>
                                                                        <span className="field-help" style={{ fontSize: '0.65rem', display: 'block', marginTop: '4px', color: '#64748b' }}>
                                                                            Keep content in the top 460px (Safe Zone)
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <input type="file" hidden accept="image/*" onChange={(e) => handleCampaignImageChange(e, 'desktop')} />
                                                            </label>
                                                        </div>

                                                        <div className="settings-input-group flex-1">
                                                            <label className="settings-label">Phone Screen Banner (Mobile)</label>
                                                            <label className="campaign-upload-zone-pro mobile-zone">
                                                                {campaignMobilePreview ? (
                                                                    <img src={campaignMobilePreview} alt="Mobile Preview" className="campaign-preview-img-pro" />
                                                                ) : (
                                                                    <div className="upload-placeholder">
                                                                        <ShoppingBag size={32} />
                                                                        <p>{t('marketing.uploadPlaceholder')}</p>
                                                                        <span className="dimension-label">380 x 500px</span>
                                                                    </div>
                                                                )}
                                                                <input type="file" hidden accept="image/*" onChange={(e) => handleCampaignImageChange(e, 'mobile')} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="form-right">
                                                    <div className="settings-input-group">
                                                        <label className="settings-label">{t('marketing.duration')}</label>
                                                        <div className="duration-options">
                                                            <label className={`duration-chip ${campaignFormData.duration_days === '7' ? 'active' : ''}`}>
                                                                <input type="radio" value="7" checked={campaignFormData.duration_days === '7'} onChange={(e) => setCampaignFormData({...campaignFormData, duration_days: e.target.value, continuous: false})} hidden />
                                                                {t('marketing.days', { count: 7 })}
                                                            </label>
                                                            <label className={`duration-chip ${campaignFormData.duration_days === '15' ? 'active' : ''}`}>
                                                                <input type="radio" value="15" checked={campaignFormData.duration_days === '15'} onChange={(e) => setCampaignFormData({...campaignFormData, duration_days: e.target.value, continuous: false})} hidden />
                                                                {t('marketing.days', { count: 15 })}
                                                            </label>
                                                            <label className={`duration-chip ${campaignFormData.duration_days === '30' ? 'active' : ''}`}>
                                                                <input type="radio" value="30" checked={campaignFormData.duration_days === '30'} onChange={(e) => setCampaignFormData({...campaignFormData, duration_days: e.target.value, continuous: false})} hidden />
                                                                {t('marketing.days', { count: 30 })}
                                                            </label>
                                                            <label className={`duration-chip ${campaignFormData.continuous ? 'active' : ''}`}>
                                                                <input type="checkbox" checked={campaignFormData.continuous} onChange={(e) => setCampaignFormData({...campaignFormData, continuous: e.target.checked, duration_days: e.target.checked ? null : '7'})} hidden />
                                                                <Zap size={14} /> {t('marketing.continuous')}
                                                            </label>
                                                        </div>
                                                        <p className="field-help">{t('marketing.continuousDesc')}</p>
                                                    </div>

                                                    <div className="campaign-summary-box">
                                                        <div className="summary-item">
                                                            <span>{t('marketing.startDate')}</span>
                                                            <strong>{t('marketing.today')}</strong>
                                                        </div>
                                                        <div className="summary-item">
                                                            <span>{t('marketing.estViews')}</span>
                                                            <strong>{t('marketing.viewsPerWeek')}</strong>
                                                        </div>
                                                        <div className="summary-item total">
                                                            <span>{t('marketing.placement')}</span>
                                                            <strong>{t('marketing.homepageHero')}</strong>
                                                        </div>
                                                    </div>

                                                    <button type="submit" className="btn-action-primary" disabled={uploading}>
                                                        {uploading ? t('marketing.creating') : t('marketing.launch')}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="campaigns-grid">
                                    {campaigns.length > 0 ? campaigns.map(campaign => (
                                        <div key={campaign.id} className="settings-card-pro campaign-item-card">
                                            <div className="campaign-banner-view">
                                                <img src={campaign.banner_url} alt="Campaign" />
                                                <div className={`campaign-status-overlay ${campaign.is_active ? 'active' : 'inactive'}`}>
                                                    {campaign.is_active ? t('marketing.active') : t('marketing.inactive')}
                                                </div>
                                            </div>
                                            <div className="campaign-meta-footer">
                                                <div className="meta-left">
                                                    <div className="meta-item">
                                                        <Calendar size={14} /> 
                                                        <span>{t('marketing.started')} {new Date(campaign.start_date).toLocaleDateString()}</span>
                                                    </div>
                                                    {campaign.end_date && (
                                                        <div className="meta-item">
                                                            <Clock size={14} />
                                                            <span>{t('marketing.ends')} {new Date(campaign.end_date).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="meta-actions">
                                                    <button 
                                                        className={`status-toggle-btn ${campaign.is_active ? 'stop' : 'start'}`}
                                                        onClick={() => toggleCampaignStatus(campaign)}
                                                    >
                                                        {campaign.is_active ? <Pause size={16} /> : <Play size={16} />}
                                                        {campaign.is_active ? t('marketing.stop') : t('marketing.resume')}
                                                    </button>
                                                    <button className="delete-campaign-btn" onClick={() => deleteCampaign(campaign.id)}>
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-campaigns">
                                            <Megaphone size={48} />
                                            <h3>{t('marketing.noActiveTitle')}</h3>
                                            <p>{t('marketing.noActiveDesc')}</p>
                                            <button className="btn-action-primary" style={{ width: 'auto', marginTop: '1rem' }} onClick={() => setIsCreatingCampaign(true)}>
                                                {t('marketing.createNew')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'categories' && (
                            <div className="categories-tab-pro">
                                <div className="product-page-header">
                                    <div className="page-title">
                                        <h2>Store Categories</h2>
                                        <p>Manage the custom category boxes shown on your public store page.</p>
                                    </div>
                                    {!isAddingCategory && (
                                        <button className="btn-add-product" onClick={() => setIsAddingCategory(true)}>
                                            <Plus size={20} /> Add New Category
                                        </button>
                                    )}
                                </div>

                                {isAddingCategory && (
                                    <div className="settings-card-pro" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
                                        <h3 style={{ marginBottom: '1.5rem' }}>Add New Category</h3>
                                        <form onSubmit={handleCreateCategory}>
                                            <div className="form-row-pro-responsive">
                                                <div className="settings-input-group" style={{ flex: 1 }}>
                                                    <label className="settings-label">Category Name (e.g. LUXURY OILS)</label>
                                                    <input 
                                                        className="settings-input-light light-bg" 
                                                        value={newCategory.name}
                                                        onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                                                        placeholder="Enter category name..."
                                                        required
                                                    />
                                                </div>
                                                <div className="settings-input-group" style={{ flex: 1 }}>
                                                    <label className="settings-label">Category Image</label>
                                                    <label className="campaign-upload-zone-pro" style={{ height: '150px' }}>
                                                        {categoryPreview ? (
                                                            <img src={categoryPreview} alt="Preview" className="campaign-preview-img-pro" />
                                                        ) : (
                                                            <div className="upload-placeholder">
                                                                <ImageIcon size={24} />
                                                                <p>Select Category Image</p>
                                                            </div>
                                                        )}
                                                        <input 
                                                            type="file" 
                                                            hidden 
                                                            accept="image/*" 
                                                            onChange={e => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    setNewCategory({...newCategory, image: file});
                                                                    setCategoryPreview(URL.createObjectURL(file));
                                                                }
                                                            }}
                                                            required
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                                <button type="submit" className="btn-action-primary" disabled={categoryUploading} style={{ width: 'auto', padding: '0.75rem 2rem' }}>
                                                    {categoryUploading ? 'Adding...' : 'Add Category'}
                                                </button>
                                                <button type="button" className="btn-action-white" onClick={() => setIsAddingCategory(false)} style={{ width: 'auto' }}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="categories-grid-dashboard" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    {customCategories.length > 0 ? customCategories.map(cat => (
                                        <div key={cat.id} className="settings-card-pro" style={{ padding: '0', overflow: 'hidden' }}>
                                            <div style={{ height: '180px', position: 'relative' }}>
                                                <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button 
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer', color: '#ef4444', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div style={{ padding: '1rem', textAlign: 'center' }}>
                                                <h4 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem' }}>{cat.name}</h4>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '20px', border: '1px dashed var(--border)' }}>
                                            <Filter size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                            <h3 style={{ color: 'var(--text-muted)' }}>No Categories Added</h3>
                                            <p style={{ color: 'var(--text-muted)' }}>Highlight specific categories to your customers with images.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'analytics' && (
                            <div className="analytics-tab-pro">
                                <div className="orders-page-header">
                                    <div className="header-text">
                                        <h2>Store Analytics</h2>
                                        <p style={{ color: 'var(--text-muted)' }}>Insights into your product performance and sales trends.</p>
                                    </div>
                                    <div className="order-stats-group">
                                        <div className="order-stat-item">
                                            <span className="order-stat-label">Total Volume</span>
                                            <span className="order-stat-value">{orders.reduce((acc, o) => acc + (o.items?.length || 0), 0)} Items</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="analytics-grid-pro">
                                    <div className="settings-card-pro">
                                        <div className="card-header-pro">
                                            <div className="card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}><TrendingUp size={24} /></div>
                                            <h3>Top Selling Products</h3>
                                        </div>
                                        <div className="analytics-list-pro">
                                            {analyticsData.mostSelling.slice(0, 10).map((stat, idx) => (
                                                <div key={idx} className="analytics-item-pro">
                                                    <div className="rank-badge">{idx + 1}</div>
                                                    <div className="item-img">
                                                        {stat.image ? <img src={stat.image} alt={stat.name} /> : <Package size={20} />}
                                                    </div>
                                                    <div className="item-details">
                                                        <p className="item-name">{stat.name}</p>
                                                        <p className="item-qty">{stat.quantity} Sold</p>
                                                    </div>
                                                    <div className="item-revenue">₹{stat.revenue.toLocaleString()}</div>
                                                </div>
                                            ))}
                                            {analyticsData.mostSelling.length === 0 && (
                                                <div className="empty-analytics">
                                                    <BarChart size={40} />
                                                    <p>No sales data available yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="settings-card-pro">
                                        <div className="card-header-pro">
                                            <div className="card-icon" style={{ background: '#fff1f2', color: '#e11d48' }}><TrendingUp size={24} style={{ transform: 'rotate(180deg)' }} /></div>
                                            <h3>Least Selling Products</h3>
                                        </div>
                                        <div className="analytics-list-pro">
                                            {analyticsData.lessSelling.slice(0, 10).map((stat, idx) => (
                                                <div key={idx} className="analytics-item-pro">
                                                    <div className="item-img">
                                                        {stat.image ? <img src={stat.image} alt={stat.name} /> : <Package size={20} />}
                                                    </div>
                                                    <div className="item-details">
                                                        <p className="item-name">{stat.name}</p>
                                                        <p className="item-qty">{stat.quantity} Sold</p>
                                                    </div>
                                                    <div className="item-revenue">₹{stat.revenue.toLocaleString()}</div>
                                                </div>
                                            ))}
                                            {analyticsData.lessSelling.length === 0 && (
                                                <div className="empty-analytics">
                                                    <BarChart size={40} />
                                                    <p>No sales data available yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                                                <div className="settings-input-group light-bg">
                                                    <label className="settings-label">Default Delivery Charges (₹)</label>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <input type="number" className="settings-input-light" style={{ flex: 1 }} placeholder="e.g. 50" value={editedStore.delivery_charges} onChange={e => setEditedStore({ ...editedStore, delivery_charges: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="settings-input-group light-bg">
                                                    <label className="settings-label">Free Delivery Above (₹)</label>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <input type="number" className="settings-input-light" style={{ flex: 1 }} placeholder="e.g. 500" value={editedStore.free_delivery_threshold} onChange={e => setEditedStore({ ...editedStore, free_delivery_threshold: e.target.value })} />
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
                                                    ADD IMAGES
                                                    <input type="file" hidden multiple accept="image/*" onChange={handleGalleryUpload} />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="settings-card-pro">
                                            <div className="card-header-pro">
                                                <div className="card-icon"><Video size={24} /></div>
                                                <h3>Store Videos</h3>
                                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: '700', color: '#6366f1' }}>MAX 2 VIDEOS</span>
                                            </div>
                                            <div className="gallery-preview-grid">
                                                {(editedStore.video_urls || store?.video_urls || []).map((url, idx) => (
                                                    <div key={idx} className="gallery-item-preview video-item">
                                                        <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                                        <div className="video-overlay"><PlayCircle size={24} color="white" /></div>
                                                        <button className="delete-gallery-img" onClick={() => handleDeleteVideo(url)}><Trash2 size={14} /></button>
                                                    </div>
                                                ))}
                                                
                                                {(editedStore.video_urls || store?.video_urls || []).length < 2 && (
                                                    <label className="gallery-add-btn" style={{ aspectRatio: '1', border: '2px dashed #6366f1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4f46e5', fontWeight: '700', fontSize: '0.75rem', gap: '0.5rem', background: '#f5f3ff' }}>
                                                        <Video size={24} color="#6366f1" />
                                                        ADD VIDEO
                                                        <input type="file" hidden accept="video/*" onChange={handleVideoUpload} />
                                                    </label>
                                                )}
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '1rem' }}>Videos help customers trust your local shop more. Maximum 2 videos allowed.</p>
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
                                                    <h4>Free Delivery</h4>
                                                    <p>{editedStore.free_delivery ? 'Enabled for all orders' : 'Disabled'}</p>
                                                </div>
                                                <div 
                                                    className={`switch-toggle ${editedStore.free_delivery ? 'active' : ''}`}
                                                    onClick={() => setEditedStore(prev => ({ ...prev, free_delivery: !prev.free_delivery }))}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className={`switch-handle ${!editedStore.free_delivery ? 'float-left' : ''}`}></div>
                                                </div>
                                            </div>

                                            <div className="ops-row">
                                                <div className="ops-label">
                                                    <h4>COD Available</h4>
                                                    <p>{editedStore.cod_available ? 'Available for orders' : 'Disabled'}</p>
                                                </div>
                                                <div 
                                                    className={`switch-toggle ${editedStore.cod_available ? 'active' : ''}`}
                                                    onClick={() => setEditedStore(prev => ({ ...prev, cod_available: !prev.cod_available }))}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className={`switch-handle ${!editedStore.cod_available ? 'float-left' : ''}`}></div>
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

                                        {/* Store Highlights Management */}
                                        <div className="sections-card-pro" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginTop: '2rem' }}>
                                            <div className="card-header-pro" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                                <div className="card-icon" style={{ background: '#ecfdf5', color: '#059669', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={24} /></div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Store Highlights</h3>
                                            </div>

                                            <div className="create-section-input" style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="New Highlight (e.g. Handmade)"
                                                        value={newHighlight}
                                                        onChange={(e) => setNewHighlight(e.target.value)}
                                                        style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem' }}
                                                    />
                                                    <button
                                                        onClick={handleAddHighlight}
                                                        style={{ background: '#059669', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>These appear in your public stats bar.</p>
                                                    <button 
                                                        onClick={(e) => { e.preventDefault(); handleUpdateStore(e); }}
                                                        style={{ background: 'none', border: '1px solid #059669', color: '#059669', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        Sync to Live Page
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="section-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {(editedStore.custom_highlights || []).length > 0 ? editedStore.custom_highlights.map((h, idx) => (
                                                    <div key={idx} style={{ 
                                                        background: '#ecfdf5', 
                                                        padding: '6px 12px', 
                                                        borderRadius: '8px', 
                                                        fontSize: '0.8rem', 
                                                        fontWeight: '600', 
                                                        color: '#065f46',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        {h}
                                                        <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveHighlight(h)} />
                                                    </div>
                                                )) : (
                                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No highlights added yet.</span>
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
                    productIdMap={productIdMap}
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
