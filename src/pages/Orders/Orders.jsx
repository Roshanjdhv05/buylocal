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

const Orders = () => {
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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock size={20} className="text-warning" />;
            case 'accepted': return <Package size={20} className="text-secondary" />;
            case 'dispatched': return <Truck size={20} className="text-primary" />;
            case 'delivered': return <CheckCircle size={20} className="text-success" />;
            default: return <Clock size={20} />;
        }
    };


    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    const EmptyState = () => (
        <div className="orders-empty-state">
            <div className="hero-empty glass-card">
                <div className="hero-icon-blob">
                    <ShoppingBag size={56} />
                </div>
                <h2>Your First Treasure Awaits</h2>
                <p>Support local creators and discover unique products in your neighborhood. Start building your order history today.</p>
                <div className="empty-actions">
                    <button onClick={() => navigate('/stores')} className="btn-primary">
                        Explore Local Stores <ArrowRight size={18} />
                    </button>
                    <button onClick={() => navigate('/categories')} className="btn-outline-dark">
                        Trending Products
                    </button>
                </div>
            </div>

            <div className="recommendations-section">
                <div className="section-title-group">
                    <div className="title-with-icon">
                        <TrendingUp size={20} className="text-primary" />
                        <h3>Popular Near You</h3>
                    </div>
                    <Link to="/categories" className="link-more">View All <ArrowRight size={14} /></Link>
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
                        <h3>Recommended Local Stores</h3>
                    </div>
                </div>
                <div className="stores-compact-list">
                    {recommendedStores.map(store => (
                        <Link to={`/store/${store.id}`} key={store.id} className="store-compact-card glass-card">
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
                            <h1>My Orders</h1>
                            <p>Track your local deliveries and support your community.</p>
                        </div>
                        <Link to="/stores" className="btn-shopping desktop-only">
                            Start Shopping
                        </Link>
                    </header>

                    <div className="orders-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                            onClick={() => setActiveTab('active')}
                        >
                            Active Orders
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
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
                                <div className="no-orders-msg">No {activeTab} orders found.</div>
                            ) : orders.filter(order =>
                                activeTab === 'active'
                                    ? ['pending', 'accepted', 'dispatched'].includes(order.status)
                                    : order.status === 'delivered'
                            ).map(order => (
                                <div key={order.id} className="order-card glass-card" onClick={() => {
                                    navigate(`/orders/${order.id}`);
                                }}>
                                    <div className="order-header">
                                        <div className="order-main-info">
                                            <h3>Order #{order.display_id || order.id.slice(0, 8).toUpperCase()}</h3>
                                            <h3>Store: {order.stores?.name}</h3>
                                            <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className={`status-badge ${order.status}`}>
                                            {getStatusIcon(order.status)}
                                            <span>{order.status}</span>
                                        </div>
                                    </div>

                                    <div className="order-body">
                                        <div className="order-items">
                                            {order.items.map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="order-item-row"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/orders/${order.id}`);
                                                    }}
                                                >
                                                    <div className="item-thumb">
                                                        <img
                                                            src={(Array.isArray(item.images) ? item.images[0] : item.image) || 'https://via.placeholder.com/60'}
                                                            alt={item.name}
                                                        />
                                                    </div>
                                                    <div className="item-details">
                                                        <span className="item-name">{item.name} x {item.quantity}</span>
                                                        <span className="item-price">₹{item.online_price * item.quantity}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-footer">
                                            <div className="order-meta-info">
                                                <div className="shipping-info">
                                                    <p><MapPin size={14} /> {order.delivery_type === 'Self-pick' ? <strong>{order.shipping_address}</strong> : order.shipping_address}</p>
                                                </div>
                                                <div className="order-badges">
                                                    <span className="meta-badge">{order.payment_method || 'COD'}</span>
                                                    <span className={`meta-badge ${order.delivery_type === 'Self-pick' ? 'self-pick' : ''}`}>
                                                        {order.delivery_type || 'Delivery'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="order-total">
                                                <span>Total Amount</span>
                                                <strong>₹{order.total_amount}</strong>
                                            </div>
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
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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

        /* Filled State Cards (Keeping Original Structure but adding modern touch) */
        .orders-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .order-card { padding: 0; overflow: hidden; background: white; }
        .order-header { 
          padding: 1.5rem; 
          background: #f8fafc; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .order-main-info h3 { font-size: 1.1rem; font-weight: 750; }
        .order-date { font-size: 0.85rem; color: #64748b; }

        .status-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 99px; font-weight: 750; text-transform: uppercase; font-size: 0.7rem; }
        
        .order-body { padding: 1.5rem; }
        .order-items { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        
        .order-item-row {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            border-radius: 12px;
            transition: var(--transition);
            text-decoration: none;
            color: inherit;
        }
        .order-item-row:hover {
            background: #f1f5f9;
            transform: translateX(5px);
        }
        .item-thumb {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
            flex-shrink: 0;
            background: #f8fafc;
        }
        .item-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .item-details {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .item-name {
            font-size: 0.95rem;
            font-weight: 600;
            color: #334155;
        }
        .item-price {
            font-weight: 700;
            color: var(--text-main);
        }
        
        .order-footer { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-end; 
          padding-top: 1.5rem; 
          border-top: 1px dashed #e2e8f0;
        }
        .order-meta-info { display: flex; flex-direction: column; gap: 0.75rem; }
        .order-badges { display: flex; gap: 0.5rem; }
        .meta-badge {
            background: #f1f5f9;
            color: #475569;
            font-size: 0.7rem;
            font-weight: 700;
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            text-transform: uppercase;
        }
        .meta-badge.self-pick {
            background: #eff6ff;
            color: var(--primary);
            border: 1px solid rgba(37, 99, 235, 0.2);
        }
        .shipping-info p { font-size: 0.85rem; color: #64748b; display: flex; gap: 0.5rem; }
        .order-total strong { font-size: 1.35rem; font-weight: 850; color: var(--primary); }
        .order-total { display: flex; align-items: center; gap: 1rem; }

        /* Categorization Tabs */
        .orders-tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            background: #f1f5f9;
            padding: 0.5rem;
            border-radius: 12px;
            width: fit-content;
        }
        .tab-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            background: none;
            border-radius: 8px;
            font-weight: 700;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
        }
        .tab-btn.active {
            background: white;
            color: #0f172a;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
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
