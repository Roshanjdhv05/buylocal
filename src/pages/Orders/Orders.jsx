import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';

const Orders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchOrders();
            subscribeToOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*, stores(name)')
            .eq('buyer_id', user.id)
            .order('created_at', { ascending: false });
        setOrders(data || []);
        setLoading(false);
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

    return (
        <div className="orders-page">
            <Navbar />

            <main className="container">
                <header className="page-header">
                    <h1>My Orders</h1>
                    <p>Track your local deliveries in real-time</p>
                </header>

                <div className="orders-container">
                    {orders.length === 0 ? (
                        <div className="empty-state glass-card">
                            <Package size={48} />
                            <h3>No orders yet</h3>
                            <p>Items you buy will appear here.</p>
                        </div>
                    ) : (
                        <div className="orders-list">
                            {orders.map(order => (
                                <div key={order.id} className="order-card glass-card">
                                    <div className="order-header">
                                        <div className="order-main-info">
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
                                                <div key={i} className="mini-item">
                                                    <span>{item.name} x {item.quantity}</span>
                                                    <span>₹{item.online_price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-footer">
                                            <div className="shipping-info">
                                                <p><MapPin size={14} /> {order.shipping_address}</p>
                                            </div>
                                            <div className="order-total">
                                                <span>Total Paid</span>
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

            <style>{`
        .orders-page { padding-bottom: 5rem; }
        .page-header { margin: 3rem 0; text-align: center; }
        .page-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .page-header p { color: var(--text-muted); }

        .orders-container { max-width: 800px; margin: 0 auto; }
        .orders-list { display: flex; flex-direction: column; gap: 2rem; }
        
        .order-card { padding: 0; overflow: hidden; }
        .order-header { 
          padding: 1.5rem; 
          background: rgba(0,0,0,0.02); 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          border-bottom: 1px solid var(--border);
        }
        .order-main-info h3 { font-size: 1.125rem; }
        .order-date { font-size: 0.875rem; color: var(--text-muted); }

        .status-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 99px; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; }
        .status-badge.pending { background: #fffbeb; color: #d97706; }
        .status-badge.accepted { background: #fdf2f8; color: #db2777; }
        .status-badge.dispatched { background: #eef2ff; color: #4f46e5; }
        .status-badge.delivered { background: #f0fdf4; color: #16a34a; }

        .order-body { padding: 1.5rem; }
        .order-items { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .mini-item { display: flex; justify-content: space-between; font-size: 0.9375rem; }
        
        .order-footer { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-end; 
          padding-top: 1.5rem; 
          border-top: 1px dashed var(--border);
        }
        .shipping-info { max-width: 60%; }
        .shipping-info p { font-size: 0.875rem; color: var(--text-muted); display: flex; gap: 0.5rem; }
        
        .order-total { text-align: right; }
        .order-total span { display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
        .order-total strong { font-size: 1.25rem; color: var(--primary); }

        .text-warning { color: #f59e0b; }
        .text-secondary { color: var(--secondary); }
        .text-primary { color: var(--primary); }
        .text-success { color: var(--success); }
      `}</style>
        </div>
    );
};

export default Orders;
