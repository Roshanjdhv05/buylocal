import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import {
    ChevronLeft, Package, Truck, CheckCircle, Clock,
    MapPin, BookOpen, Calendar, Hash, Info, ShoppingBag
} from 'lucide-react';
import InvoiceModal from '../../components/InvoiceModal';

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    useEffect(() => {
        if (user && orderId) {
            fetchOrderDetails();
        }
    }, [user, orderId]);

    const fetchOrderDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, stores(*), buyer:users(username, email)')
                .eq('id', orderId)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order details:', error.message);
            // If ID lookup fails, try display_id (custom format)
            try {
                const { data } = await supabase
                    .from('orders')
                    .select('*, stores(*), buyer:users(username, email)')
                    .eq('display_id', orderId)
                    .single();
                if (data) setOrder(data);
            } catch (innerError) {
                console.error('Display ID lookup also failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const OrderTracker = ({ status }) => {
        const stages = ['accepted', 'dispatched', 'delivered'];
        const currentIdx = stages.indexOf(status);

        return (
            <div className="order-tracker">
                {stages.map((stage, idx) => {
                    const isCompleted = idx <= currentIdx;
                    const isActive = idx === currentIdx;
                    return (
                        <div key={stage} className={`tracker-stage ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                            <div className="tracker-point">
                                {isCompleted ? <CheckCircle size={14} /> : <div className="dot" />}
                            </div>
                            <span className="tracker-label">{stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
                            {idx < stages.length - 1 && <div className="tracker-line" />}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    if (!order) return (
        <div className="order-details-page">
            <Navbar />
            <div className="container error-state">
                <h2>Order Not Found</h2>
                <p>We couldn't find the order you're looking for.</p>
                <button onClick={() => navigate('/orders')} className="btn-primary">Back to My Orders</button>
            </div>
        </div>
    );

    const displayOrderId = order.display_id || order.id.slice(0, 8).toUpperCase();

    return (
        <div className="order-details-page">
            <Navbar />

            <main className="container order-details-layout">
                <div className="details-header">
                    <button onClick={() => navigate('/orders')} className="btn-back">
                        <ChevronLeft size={20} /> Back to Orders
                    </button>
                    <h1>Order Details</h1>
                </div>

                <div className="details-grid">
                    <div className="details-main">
                        {/* Order Overview Card */}
                        <div className="order-overview-card glass-card">
                            <div className="overview-header">
                                <div className="id-group">
                                    <Hash size={18} className="text-subtle" />
                                    <span>Order ID: <strong>{displayOrderId}</strong></span>
                                </div>
                                <div className={`status-badge-lg ${order.status}`}>
                                    {order.status}
                                </div>
                            </div>
                            <div className="overview-meta">
                                <div className="meta-item">
                                    <Calendar size={18} />
                                    <div>
                                        <label>Order Date</label>
                                        <p>{new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>
                                <div className="meta-item">
                                    <ShoppingBag size={18} />
                                    <div>
                                        <label>Store</label>
                                        <p>{order.stores?.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tracker Card */}
                        <div className="tracker-card glass-card">
                            <h3>Tracking Progress</h3>
                            <OrderTracker status={order.status} />
                        </div>

                        {/* Items Card */}
                        <div className="items-card glass-card">
                            <h3>Items Ordered ({order.items?.length})</h3>
                            <div className="items-list-full">
                                {order.items?.map((item, i) => (
                                    <div key={i} className="detail-item-row">
                                        <div className="item-img-box">
                                            <img src={(Array.isArray(item.images) ? item.images[0] : item.image) || 'https://via.placeholder.com/80'} alt={item.name} />
                                        </div>
                                        <div className="item-info-main">
                                            <h4>{item.name}</h4>
                                            <p className="item-qty-price">Quantity: {item.quantity} × ₹{item.online_price || item.price}</p>
                                        </div>
                                        <div className="item-subtotal">
                                            ₹{(item.online_price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="details-sidebar">
                        {/* Shipping & Payment Card */}
                        <div className="summary-card glass-card">
                            <div className="summary-section">
                                <h3><MapPin size={18} /> Delivery Details</h3>
                                <div className="content-box">
                                    <p className="addr-text"><strong>{order.buyer?.username || 'Customer'}</strong></p>
                                    <p className="addr-text">{order.shipping_address}</p>
                                    <p className="delivery-type-tag">{order.delivery_type || 'Standard Delivery'}</p>
                                </div>
                            </div>

                            <div className="summary-section total-summary">
                                <h3>Total Summary</h3>
                                <div className="total-line">
                                    <span>Subtotal</span>
                                    <span>₹{order.total_amount.toFixed(2)}</span>
                                </div>
                                <div className="total-line shipping">
                                    <span>Delivery Charge</span>
                                    <span className="text-success">FREE</span>
                                </div>
                                <div className="total-line grand">
                                    <span>Grand Total</span>
                                    <strong>₹{order.total_amount.toFixed(2)}</strong>
                                </div>
                            </div>

                            <button className="btn-invoice-dedicated" onClick={() => setIsInvoiceModalOpen(true)}>
                                <BookOpen size={20} /> View Tax Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {isInvoiceModalOpen && (
                <InvoiceModal
                    order={order}
                    store={order.stores}
                    onClose={() => setIsInvoiceModalOpen(false)}
                />
            )}

            <style>{`
                .order-details-page { background: #f8fafc; min-height: 100vh; padding-bottom: 5rem; }
                .order-details-layout { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; }
                
                .details-header { margin-bottom: 2rem; }
                .btn-back { display: flex; align-items: center; gap: 0.5rem; background: none; border: none; font-weight: 600; color: #64748b; cursor: pointer; margin-bottom: 1rem; transition: 0.2s; }
                .btn-back:hover { color: #0f172a; transform: translateX(-4px); }
                .details-header h1 { font-size: 2rem; font-weight: 850; color: #0f172a; }

                .details-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
                .details-main { display: flex; flex-direction: column; gap: 1.5rem; }

                /* Overview Card */
                .order-overview-card { padding: 1.5rem; }
                .overview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .id-group { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; }
                .status-badge-lg { padding: 0.5rem 1.25rem; border-radius: 99px; font-weight: 800; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }
                .status-badge-lg.delivered { background: #d1fae5; color: #065f46; }
                .status-badge-lg.dispatched { background: #dbeafe; color: #1e40af; }
                .status-badge-lg.accepted { background: #e0e7ff; color: #3730a3; }
                .status-badge-lg.pending { background: #fef3c7; color: #92400e; }

                .overview-meta { display: flex; gap: 3rem; }
                .meta-item { display: flex; align-items: center; gap: 1rem; color: #64748b; }
                .meta-item label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #94a3b8; }
                .meta-item p { font-weight: 700; color: #1e293b; margin: 0; }

                /* Tracker Card */
                .tracker-card { padding: 1.5rem; }
                .tracker-card h3 { font-size: 1.1rem; font-weight: 800; margin-bottom: 2rem; color: #1e293b; }
                .order-tracker { display: flex; justify-content: space-between; position: relative; }
                .tracker-stage { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; z-index: 1; }
                .tracker-point { width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; border: 3px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 0.75rem; transition: 0.3s; }
                .tracker-stage.completed .tracker-point { background: #10b981; border-color: #10b981; }
                .tracker-stage.active .tracker-point { border-color: #10b981; box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.15); }
                .tracker-line { position: absolute; top: 15px; left: 50%; width: 100%; height: 3px; background: #e2e8f0; z-index: -1; }
                .tracker-stage.completed .tracker-line { background: #10b981; }
                .tracker-label { font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
                .tracker-stage.completed .tracker-label { color: #1e293b; }
                .tracker-stage.active .tracker-label { color: #10b981; }

                /* Items Card */
                .items-card { padding: 1.5rem; }
                .items-card h3 { font-size: 1.1rem; font-weight: 800; margin-bottom: 1.5rem; color: #1e293b; }
                .items-list-full { display: flex; flex-direction: column; gap: 1rem; }
                .detail-item-row { display: flex; align-items: center; gap: 1.25rem; padding: 1rem; background: #f8fafc; border-radius: 12px; transition: 0.2s; }
                .detail-item-row:hover { background: #f1f5f9; }
                .item-img-box { width: 80px; height: 80px; border-radius: 10px; overflow: hidden; background: white; flex-shrink: 0; }
                .item-img-box img { width: 100%; height: 100%; object-fit: cover; }
                .item-info-main { flex: 1; }
                .item-info-main h4 { font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 0.25rem; }
                .item-qty-price { color: #64748b; font-size: 0.9rem; margin: 0; }
                .item-subtotal { font-size: 1.1rem; font-weight: 800; color: #0f172a; }

                /* Sidebar / Summary */
                .summary-card { padding: 1.5rem; position: sticky; top: 100px; }
                .summary-section { margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; }
                .summary-section h3 { font-size: 1rem; font-weight: 800; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: #1e293b; }
                .content-box { color: #475569; }
                .addr-text { font-size: 0.95rem; line-height: 1.5; margin-bottom: 0.5rem; }
                .delivery-type-tag { display: inline-block; background: #f1f5f9; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; }

                .total-line { display: flex; justify-content: space-between; margin-bottom: 0.75rem; color: #64748b; font-weight: 600; }
                .total-line.grand { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 2px solid #f1f5f9; color: #0f172a; font-size: 1.25rem; }
                .total-line.grand strong { color: var(--primary); }

                .btn-invoice-dedicated { width: 100%; background: #0f172a; color: white; border: none; padding: 1rem; border-radius: 12px; font-weight: 750; display: flex; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; transition: 0.2s; margin-top: 1rem; }
                .btn-invoice-dedicated:hover { background: #1e293b; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

                @media (max-width: 900px) {
                    .details-grid { grid-template-columns: 1fr; }
                    .details-sidebar { order: -1; }
                    .summary-card { position: static; }
                }

                @media (max-width: 640px) {
                    .order-details-layout { padding: 1rem; }
                    .details-header h1 { font-size: 1.5rem; }
                    .overview-meta { flex-direction: column; gap: 1rem; }
                    .item-img-box { width: 60px; height: 60px; }
                    .item-subtotal { font-size: 1rem; }
                    .tracker-label { font-size: 0.65rem; }
                    .tracker-point { width: 24px; height: 24px; border-width: 2px; }
                    .tracker-line { top: 11px; }
                }
            `}</style>
        </div>
    );
};

export default OrderDetails;
