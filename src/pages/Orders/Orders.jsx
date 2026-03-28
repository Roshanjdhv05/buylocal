import React, { useState, useEffect } from 'react';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import {
    Package, Truck, CheckCircle, Clock, MapPin,
    ShoppingBag, ArrowRight, ShieldCheck,
    Headphones, RefreshCcw, Star, Store,
    TrendingUp, ExternalLink, BookOpen, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import InvoiceModal from '../../components/InvoiceModal';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/productTranslations';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const Orders = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [recommendedStores, setRecommendedStores] = useState([]);
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        if (user) {
            fetchOrders();
            fetchRecommendations();
            subscribeToOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            const { data } = await supabase
                .from('orders')
                .select('*, stores(*), buyer:users(username, email)')
                .eq('buyer_id', user.id)
                .order('created_at', { ascending: false });
            setOrders(data || []);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        try {
            // Fetch top trending products
            const { data: pData } = await withTimeout(supabase
                .from('products')
                .select('*')
                .order('views_count', { ascending: false })
                .limit(4));
            setTrendingProducts(pData || []);

            // Fetch top rated stores
            const { data: sData } = await withTimeout(supabase
                .from('stores')
                .select('*')
                .limit(3));
            setRecommendedStores(sData || []);
        } catch (e) {
            console.warn('Recommendations fetch failed', e.message);
        }
    };

    const subscribeToOrders = () => {
        const subscription = supabase
            .channel('buyer_orders')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `buyer_id=eq.${user.id}`
            }, (payload) => {
                setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    };

    const getStatusText = (status) => {
        return t(`orders.${status}`) || status;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock size={16} />;
            case 'accepted': return <CheckCircle size={16} />;
            case 'dispatched': return <Truck size={16} />;
            case 'delivered': return <Package size={16} />;
            case 'cancelled': return <X size={16} />;
            default: return <ShoppingBag size={16} />;
        }
    };


    if (loading) return <LoadingSpinner fullPage />;

    const EmptyState = () => (
        <div className="orders-empty-state">
            <div className="hero-empty glass-card">
                <div className="hero-icon-blob">
                    <ShoppingBag size={56} />
                </div>
                <h2>{t('orders.emptyTitle')}</h2>
                <p>{t('orders.emptySubtitle')}</p>
                <div className="empty-actions">
                    <button onClick={() => navigate('/stores')} className="btn-primary">
                        {t('orders.exploreStores')} <ArrowRight size={18} />
                    </button>
                    <button onClick={() => navigate('/categories')} className="btn-outline-dark">
                        {t('orders.popularTitle')}
                    </button>
                </div>
            </div>

            <div className="recommendations-section">
                <div className="section-title-group">
                    <div className="title-with-icon">
                        <TrendingUp size={20} className="text-primary" />
                        <h3>{t('orders.popularTitle')}</h3>
                    </div>
                    <Link to="/categories" className="link-more">{t('home.seeAll')} <ArrowRight size={14} /></Link>
                </div>
                <div className="products-mini-grid">
                    {trendingProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>

            <div className="recommendations-section">
                <div className="section-title-group">
                    <div className="title-with-icon">
                        <Store size={20} className="text-primary" />
                        <h3>{t('orders.recommendedStores')}</h3>
                    </div>
                </div>
                <div className="stores-compact-list">
                    {recommendedStores.map(store => (
                        <Link to={`/${encodeURIComponent(store.name)}`} key={store.id} className="store-compact-card glass-card">

                            <img src={store.banner_url || 'https://via.placeholder.com/80'} alt={store.name} />
                            <div className="store-compact-info">
                                <h4>{store.name}</h4>
                                <span>{store.category}</span>
                            </div>
                            <ExternalLink size={16} className="icon-subtle" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="orders-page">
            <Navbar />

            <main className="container main-layout">
                <div className="orders-main-content">
                    <header className="page-header">
                        <div className="header-text">
                            <h1>{t('orders.title')}</h1>
                            <p>{t('orders.subtitle')}</p>
                        </div>
                        <Link to="/stores" className="btn-shopping desktop-only">
                            {t('orders.startShopping')}
                        </Link>
                    </header>

                    <div className="orders-tabs-mobile">
                        <button
                            className={`tab-btn-mobile ${activeTab === 'active' ? 'active' : ''}`}
                            onClick={() => setActiveTab('active')}
                        >
                            Active Orders
                        </button>
                        <button
                            className={`tab-btn-mobile ${activeTab === 'past' ? 'active' : ''}`}
                            onClick={() => setActiveTab('past')}
                        >
                            Past Orders
                        </button>
                    </div>

                    {orders.length === 0 ? <EmptyState /> : (
                        <div className="orders-list">
                            {orders.filter(order =>
                                activeTab === 'active'
                                    ? ['pending', 'accepted', 'dispatched'].includes(order.status)
                                    : order.status === 'delivered'
                            ).length === 0 ? (
                                <div className="no-orders-msg">{t('orders.noOrders')}</div>
                            ) : orders.filter(order =>
                                activeTab === 'active'
                                    ? ['pending', 'accepted', 'dispatched'].includes(order.status)
                                    : order.status === 'delivered'
                            ).map(order => (
                                <div key={order.id} className="order-card-mobile glass-card" onClick={() => {
                                    navigate(`/orders/${order.id}`);
                                }}>
                                    <div className="order-card-inner">
                                        <div className="order-header-top">
                                            <span className="order-id-text">#ORD-{order.id.slice(0, 6).toUpperCase()}</span>
                                            <div className={`status-pill ${order.status}`}>
                                                <div className="status-dot"></div>
                                                <span>{order.status === 'pending' ? 'PENDING' : order.status === 'accepted' ? 'IN PROGRESS' : order.status === 'dispatched' ? 'DISPATCHED' : order.status === 'delivered' ? 'DELIVERED' : order.status.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <h3 className="order-store-name">{order.stores?.name}</h3>
                                        
                                        <div className="order-items-wrapper">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="order-item-mobile">
                                                    <div className="item-image-wrapper">
                                                        <img
                                                            src={(Array.isArray(item.images) ? item.images[0] : item.image) || 'https://via.placeholder.com/80'}
                                                            alt={item.name}
                                                        />
                                                    </div>
                                                    <div className="item-info-mobile">
                                                        <h4>{getLocalizedName(item.name, i18n.language)}</h4>
                                                        <p className="item-meta-mobile">Qty: {item.quantity} • {order.delivery_type === 'Self-pick' ? 'Self-pickup' : `Home Delivery`}</p>
                                                        <div className="item-price-mobile">₹{item.online_price}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-divider"></div>

                                        <div className="order-summary-mobile">
                                            <div className="payment-method-mobile">
                                                <div className="payment-icon">
                                                    {order.payment_method === 'COD' ? <span style={{fontWeight:'bold', fontSize:'0.75rem'}}>₹</span> : '💳'}
                                                </div>
                                                <span>{order.payment_method === 'COD' ? 'COD' : 'Online Payment'}</span>
                                            </div>
                                            <div className="total-amount-mobile">
                                                <span>Total Amount</span>
                                                <strong>₹{order.total_amount}</strong>
                                            </div>
                                        </div>

                                        <div className="order-actions-mobile">
                                            {activeTab === 'active' ? (
                                                <button className="btn-action primary" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}>Track Order</button>
                                            ) : (
                                                <button className="btn-action primary-light" onClick={(e) => { e.stopPropagation(); navigate(`/${encodeURIComponent(order.stores?.name)}`); }}>Reorder</button>
                                            )}
                                            <button className="btn-action secondary" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}>Details</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* No longer needed here as it's in OrderDetails page */}

            <style>{`
        .orders-page { 
            background: #f8fafc; 
            min-height: 100vh;
            padding-bottom: 5rem; 
        }
        
        .main-layout {
            max-width: 900px;
            margin: 2rem auto;
        }

        .page-header { 
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2.5rem; 
        }
        .header-text h1 { font-size: 2.25rem; font-weight: 850; margin-bottom: 0.5rem; color: #0f172a; }
        .header-text p { color: #64748b; font-size: 1.1rem; }

        .btn-shopping {
            background: #0f172a;
            color: white;
            padding: 0.85rem 1.75rem;
            border-radius: 12px;
            font-weight: 700;
            transition: var(--transition);
        }
        .btn-shopping:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }

        /* Empty State */
        .hero-empty {
            padding: 4rem 2rem;
            text-align: center;
            margin-bottom: 4rem;
            background: white;
            border: 2px solid white;
        }
        .hero-icon-blob {
            width: 100px;
            height: 100px;
            background: #f1f5f9;
            color: var(--primary);
            border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 2rem;
            animation: morphing 10s infinite alternate;
        }
        @keyframes morphing {
            0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
            100% { border-radius: 70% 30% 30% 70% / 60% 40% 60% 40%; }
        }
        .hero-empty h2 { font-size: 2rem; font-weight: 850; margin-bottom: 1rem; color: #1e293b; }
        .hero-empty p { max-width: 500px; margin: 0 auto 2.5rem; color: #64748b; line-height: 1.6; }
        
        .empty-actions { display: flex; gap: 1rem; justify-content: center; }
        .btn-outline-dark {
            border: 2px solid #e2e8f0;
            background: white;
            color: #0f172a;
            padding: 0.85rem 1.75rem;
            border-radius: 12px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: var(--transition);
        }
        .btn-outline-dark:hover { background: #f8fafc; border-color: #cbd5e1; }

        /* Recommendations */
        .recommendations-section { margin-bottom: 4rem; }
        .section-title-group {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .title-with-icon { display: flex; align-items: center; gap: 0.75rem; }
        .title-with-icon h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
        .link-more { color: var(--primary); font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 0.35rem; }

        .products-mini-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 1.25rem;
        }

        .stores-compact-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .store-compact-card {
            display: flex;
            align-items: center;
            padding: 1rem;
            gap: 1.25rem;
            background: white;
            transition: var(--transition);
        }
        .store-compact-card:hover { transform: translateX(8px); border-color: var(--primary); }
        .store-compact-card img { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; }
        .store-compact-info { flex: 1; }
        .store-compact-info h4 { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.15rem; }
        .store-compact-info span { font-size: 0.85rem; color: #64748b; }
        .icon-subtle { color: #cbd5e1; }

        /* Sidebar */
        .orders-sidebar { position: sticky; top: 100px; height: fit-content; }
        .sidebar-group { margin-bottom: 3rem; }
        .sidebar-group h3 { font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 1.5rem; }
        
        .benefit-card {
            display: flex;
            gap: 1rem;
            padding: 1.25rem;
            margin-bottom: 1rem;
            background: white;
        }
        .benefit-card h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.25rem; }
        .benefit-card p { font-size: 0.8rem; color: #64748b; line-height: 1.4; }

        .support-links { list-style: none; padding: 0; }
        .support-links li { margin-bottom: 0.75rem; }
        .support-links a {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: white;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 600;
            color: #475569;
            transition: var(--transition);
            border: 1px solid #e2e8f0;
        }
        .support-links a:hover { color: var(--primary); border-color: var(--primary); transform: translateX(5px); }

        /* Mobile Redesign Orders Specific Styles */
        .orders-page { 
            background: #fdfcff; /* Soft pale purple/white tint based on image */
            min-height: 100vh;
            padding-bottom: 5rem; 
        }

        .orders-tabs-mobile {
            display: flex;
            background: #f5edfc;
            padding: 0.35rem;
            border-radius: 99px;
            margin-bottom: 1.5rem;
            width: 100%;
            gap: 0;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }

        .tab-btn-mobile {
            flex: 1;
            padding: 0.85rem;
            border: none;
            background: transparent;
            color: #8c71a3;
            font-weight: 700;
            border-radius: 99px;
            cursor: pointer;
            transition: all 0.25s ease;
            font-size: 0.95rem;
        }

        .tab-btn-mobile.active {
            background: #6D28D9;
            color: white;
            box-shadow: 0 4px 10px rgba(109, 40, 217, 0.25);
        }

        .orders-list { 
            display: flex; 
            flex-direction: column; 
            gap: 1.25rem; 
        }

        .order-card-mobile {
            background: white;
            border-radius: 20px;
            padding: 1.5rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.03);
            border: 1px solid rgba(255,255,255,0.5);
            transition: var(--transition);
        }

        .order-header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .order-id-text {
            color: #a78bfa;
            font-weight: 800;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
        }

        .status-pill {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.3rem 0.6rem;
            border-radius: 99px;
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
        }
        
        .status-pill .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }

        .status-pill.pending, .status-pill.accepted {
            background: #ede9fe;
            color: #6d28d9;
        }
        .status-pill.pending .status-dot, .status-pill.accepted .status-dot {
            background: #6d28d9;
        }

        .status-pill.dispatched {
            background: #ffedd5;
            color: #ea580c;
        }
        .status-pill.dispatched .status-dot {
            background: #ea580c;
        }

        .status-pill.delivered {
            background: #ecfdf5;
            color: #059669;
        }
        .status-pill.delivered .status-dot {
            background: #059669;
        }

        .status-pill.cancelled {
            background: #fee2e2;
            color: #dc2626;
        }
        .status-pill.cancelled .status-dot {
            background: #dc2626;
        }

        .order-store-name {
            font-size: 1.25rem;
            font-weight: 850;
            color: #1e293b;
            margin-bottom: 1.25rem;
        }

        .order-item-mobile {
            display: flex;
            gap: 1.25rem;
            align-items: center;
            margin-bottom: 1.25rem;
        }

        .item-image-wrapper {
            width: 80px;
            height: 80px;
            border-radius: 16px;
            overflow: hidden;
            flex-shrink: 0;
            background: #f8fafc;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .item-image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .item-info-mobile h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #334155;
            margin-bottom: 0.25rem;
        }

        .item-meta-mobile {
            font-size: 0.8rem;
            color: #64748b;
            margin-bottom: 0.5rem;
        }

        .item-price-mobile {
            font-size: 1.1rem;
            font-weight: 850;
            color: #6d28d9;
        }

        .order-divider {
            height: 1px;
            background: #f1f5f9;
            margin: 1.25rem 0;
            width: 100%;
        }

        .order-summary-mobile {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .payment-method-mobile {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: #64748b;
        }

        .payment-icon {
            background: #f1f5f9;
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #475569;
        }

        .total-amount-mobile {
            text-align: right;
            display: flex;
            flex-direction: column;
        }

        .total-amount-mobile span {
            font-size: 0.75rem;
            color: #64748b;
            margin-bottom: 0.15rem;
        }

        .total-amount-mobile strong {
            font-size: 1.25rem;
            font-weight: 850;
            color: #1e293b;
        }

        .order-actions-mobile {
            display: flex;
            gap: 1rem;
        }

        .btn-action {
            flex: 1;
            padding: 0.85rem;
            border-radius: 12px;
            font-weight: 750;
            font-size: 0.95rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-action.primary {
            background: #8b5cf6;
            color: white;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .btn-action.primary-light {
            background: #f3e8ff;
            color: #6d28d9;
        }

        .btn-action.secondary {
            background: #f5edfc;
            color: #8c71a3;
        }

        .no-orders-msg {
            padding: 3rem;
            text-align: center;
            color: #94a3b8;
            font-weight: 600;
        }

        @media (max-width: 1100px) {
            .main-layout { grid-template-columns: 1fr; }
            .desktop-only { display: none; }
        }

        @media (max-width: 640px) {
            .hero-empty { padding: 3rem 1rem; }
            .hero-empty h2 { font-size: 1.5rem; }
            .empty-actions { flex-direction: column; }
            .products-mini-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        }
      `}</style>
        </div>
    );
};

export default Orders;
