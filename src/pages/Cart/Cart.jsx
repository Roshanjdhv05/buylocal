import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import Navbar from '../../components/Navbar';
import { ShoppingBag, Trash2, Plus, Minus, CreditCard, MapPin, Phone } from 'lucide-react';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [orderForm, setOrderForm] = useState({
        shipping_address: profile?.address || '',
        contact_number: profile?.phone || '',
        payment_method: 'COD',
        delivery_type: 'Delivery'
    });

    const calculateDeliveryCharges = () => {
        if (orderForm.delivery_type === 'Self-pick') return 0;
        return cart.reduce((total, item) => total + (item.delivery_charges || 0), 0);
    };

    const deliveryCharges = calculateDeliveryCharges();
    const finalTotal = cartTotal + deliveryCharges;

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!user) return navigate('/login');
        if (cart.length === 0) return;

        setLoading(true);
        try {
            // Group items by store (since orders are store-specific)
            const storesInCart = [...new Set(cart.map(item => item.store_id))];

            // Get today's order count for ID generation
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const date = now.getDate();
            const dateStr = `${year}${month}${date}`;

            const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
            const { count: todayCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfDay);

            let currentCount = (todayCount || 0) + 1;

            for (const storeId of storesInCart) {
                const storeItems = cart.filter(item => item.store_id === storeId);
                const storeCartTotal = storeItems.reduce((acc, item) => acc + (item.online_price * item.quantity), 0);
                const storeDeliveryCharges = orderForm.delivery_type === 'Self-pick' ? 0 : storeItems.reduce((acc, item) => acc + (item.delivery_charges || 0), 0);

                const customOrderId = `${dateStr}${currentCount}`;

                const { error } = await supabase
                    .from('orders')
                    .insert([{
                        buyer_id: user.id,
                        store_id: storeId,
                        items: storeItems,
                        total_amount: storeCartTotal + storeDeliveryCharges,
                        delivery_charges: storeDeliveryCharges,
                        display_id: customOrderId,
                        shipping_address: orderForm.delivery_type === 'Self-pick' ? 'Self-pick at Store' : orderForm.shipping_address,
                        contact_number: orderForm.contact_number,
                        payment_method: orderForm.payment_method,
                        delivery_type: orderForm.delivery_type,
                        status: 'pending'
                    }]);

                if (error) throw error;
                currentCount++; // Increment for next store in current checkout session
            }

            clearCart();
            navigate('/orders');
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cart-page">
            <Navbar />

            <main className="container">
                <div className="cart-grid">
                    <section className="cart-items-section glass-card">
                        <div className="section-header">
                            <h2><ShoppingBag size={24} /> Your Cart</h2>
                            <span>{cart.length} Store(s)</span>
                        </div>

                        {cart.length === 0 ? (
                            <div className="empty-cart">
                                <p>Your cart is empty.</p>
                                <Link to="/" className="btn-primary">Browse Products</Link>
                            </div>
                        ) : (
                            <div className="items-list">
                                {cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <Link to={`/product/${item.id}`} className="item-info-link">
                                            <img src={item.images?.[0] || item.image} alt={item.name} className="item-img" />
                                            <div className="item-details">
                                                <h3>{item.name}</h3>
                                                <p className="item-store">{item.storeName}</p>
                                                <p className="item-price">₹{item.online_price} {item.delivery_charges > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(+₹{item.delivery_charges} Del.)</span>}</p>
                                            </div>
                                        </Link>
                                        <div className="item-controls">
                                            <div className="quantity-toggle">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={16} /></button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={16} /></button>
                                            </div>
                                            <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {cart.length > 0 && (
                        <section className="checkout-section">
                            <div className="summary-card glass-card">
                                <h3>Order Summary</h3>
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>₹{cartTotal}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Delivery</span>
                                    {deliveryCharges > 0 ? (
                                        <span>₹{deliveryCharges}</span>
                                    ) : (
                                        <span className="free">FREE</span>
                                    )}
                                </div>
                                <hr />
                                <div className="summary-row total">
                                    <span>Total</span>
                                    <span>₹{finalTotal}</span>
                                </div>

                                <form onSubmit={handleCheckout} className="checkout-form">
                                    <div className="input-group">
                                        <label><Phone size={16} /> Contact Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={orderForm.contact_number}
                                            onChange={(e) => setOrderForm({ ...orderForm, contact_number: e.target.value })}
                                        />
                                    </div>

                                    <div className="options-group">
                                        <label>Delivery Method</label>
                                        <div className="selection-grid">
                                            <div
                                                className={`option-card ${orderForm.delivery_type === 'Delivery' ? 'active' : ''}`}
                                                onClick={() => setOrderForm({ ...orderForm, delivery_type: 'Delivery' })}
                                            >
                                                Home Delivery
                                            </div>
                                            <div
                                                className={`option-card self-pick-card ${orderForm.delivery_type === 'Self-pick' ? 'active glow' : ''}`}
                                                onClick={() => setOrderForm({ ...orderForm, delivery_type: 'Self-pick' })}
                                            >
                                                <strong>Self pick</strong>
                                                <p className="option-desc">Buyer can get his order by visiting the store</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="options-group">
                                        <label>Payment Method</label>
                                        <div className="selection-grid single-option">
                                            <div
                                                className="option-card active"
                                            >
                                                COD (Cash on Delivery)
                                            </div>
                                        </div>
                                    </div>

                                    {orderForm.delivery_type === 'Delivery' && (
                                        <div className="input-group">
                                            <label><MapPin size={16} /> Shipping Address</label>
                                            <textarea
                                                required
                                                value={orderForm.shipping_address}
                                                onChange={(e) => setOrderForm({ ...orderForm, shipping_address: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    <button type="submit" className="btn-primary checkout-btn" disabled={loading}>
                                        {loading ? 'Processing...' : `Place Order (₹${cartTotal})`}
                                        {!loading && <CreditCard size={18} />}
                                    </button>
                                </form>
                            </div>
                        </section>
                    )}
                </div>
            </main>

            <style>{`
        .cart-page { padding-top: 2rem; padding-bottom: 5rem; }
        .cart-grid { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: start; }
        
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
        .cart-items-section { padding: 2rem; }

        .items-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .cart-item { display: flex; align-items: center; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
        .cart-item:last-child { border-bottom: none; padding-bottom: 0; }
        
        .item-info-link { display: flex; align-items: center; gap: 1.5rem; flex: 1; text-decoration: none; color: inherit; }
        .item-img { width: 80px; height: 80px; border-radius: var(--radius-md); object-fit: cover; background: #f1f5f9; flex-shrink: 0;}
        .item-details { flex: 1; }
        .item-details h3 { font-size: 1.125rem; margin-bottom: 0.25rem; color: var(--text-main); }
        .item-store { font-size: 0.875rem; color: var(--text-muted); }
        .item-price { font-weight: 700; color: var(--primary); margin-top: 0.25rem; }

        .item-controls { display: flex; align-items: center; gap: 1.5rem; }
        .quantity-toggle { display: flex; align-items: center; background: #f1f5f9; border-radius: 99px; padding: 0.25rem; }
        .quantity-toggle button { padding: 0.5rem; border-radius: 50%; color: var(--text-muted); display: flex; align-items: center; justify-content: center; border: none; background: transparent; cursor: pointer; }
        .quantity-toggle button:hover { background: white; color: var(--primary); }
        .quantity-toggle span { width: 30px; text-align: center; font-weight: 600; font-size: 0.9rem; }
        .remove-btn { color: var(--text-muted); padding: 0.5rem; border-radius: 50%; border: none; background: transparent; cursor: pointer; transition: 0.2s; }
        .remove-btn:hover { color: var(--error); background: #fef2f2; }

        .summary-card { padding: 2rem; position: sticky; top: 100px; }
        .summary-card h3 { margin-bottom: 1.5rem; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--text-muted); }
        .summary-row.total { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-top: 1rem; }
        .free { color: var(--success); font-weight: 600; }

        .checkout-form { margin-top: 2rem; display: flex; flex-direction: column; gap: 1.25rem; }
        
        .options-group { display: flex; flex-direction: column; gap: 0.75rem; }
        .options-group label { font-size: 0.875rem; font-weight: 700; color: var(--text-main); }
        .selection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        
        .option-card {
            padding: 1rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: 0.3s;
            text-align: center;
            font-size: 0.9rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 80px;
        }
        .option-card.active {
            border-color: var(--primary);
            background: #eff6ff;
            color: var(--primary);
        }
        
        .self-pick-card strong { font-size: 1rem; display: block; }
        .option-desc { font-size: 0.75rem; color: var(--text-muted); line-height: 1.2; margin-top: 0.4rem; }
        
        .glow {
            box-shadow: 0 0 15px rgba(37, 99, 235, 0.4);
            border-color: var(--primary) !important;
            animation: pulse-glow 2s infinite;
        }
        
        @keyframes pulse-glow {
            0% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.2); }
            50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.6); }
            100% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.2); }
        }

        .checkout-btn { width: 100%; padding: 1rem; font-size: 1.125rem; margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

        .empty-cart { text-align: center; padding: 3rem 0; color: var(--text-muted); }
        .empty-cart a { margin-top: 1.5rem; display: inline-block; }

        @media (max-width: 1024px) {
          .cart-grid { grid-template-columns: 1fr; }
          .summary-card { position: static; }
        }

        @media (max-width: 640px) {
            .cart-page { padding-top: 1rem; padding-bottom: 6rem; }
            .cart-items-section, .summary-card { padding: 1.25rem; }
            
            .cart-item { flex-direction: column; align-items: flex-start; gap: 1rem; position: relative; }
            .item-info-link { width: 100%; gap: 1rem; }
            .item-img { width: 70px; height: 70px; }
            .item-details h3 { font-size: 1rem; }
            
            .item-controls { width: 100%; justify-content: space-between; margin-top: 0.5rem; }
            .remove-btn { position: absolute; top: 0; right: 0; }
        }
      `}</style>
        </div>
    );
};

export default Cart;
