import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
    ChevronLeft, ShieldCheck, CreditCard, Clock, 
    CheckCircle2, AlertCircle, Package, Zap, 
    BarChart3, Globe, ShieldQuestion
} from 'lucide-react';
import './Subscription.css';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const Subscription = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [daysRemaining, setDaysRemaining] = useState(0);

    useEffect(() => {
        if (profile?.id) {
            fetchStoreData();
        }
    }, [profile]);

    const fetchStoreData = async () => {
        try {
            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .eq('owner_id', profile.id)
                .single();

            if (error) throw error;
            setStore(data);

            if (data.subscription_end_date) {
                const end = new Date(data.subscription_end_date);
                const now = new Date();
                const diffTime = end - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setDaysRemaining(diffDays > 0 ? diffDays : 0);
            }
        } catch (error) {
            console.error('Error fetching store data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner fullPage />;

    const isPremium = store?.subscription_tier === 'premium';

    return (
        <div className="subscription-page">
            <header className="sub-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={20} />
                    <span>Back to Dashboard</span>
                </button>
                <h1>Subscription Management</h1>
            </header>

            <div className="sub-content">
                {/* Current Status Card */}
                <div className={`status-card ${isPremium ? 'premium' : 'free'}`}>
                    <div className="status-info">
                        <div className="status-label">CURRENT PLAN</div>
                        <div className="plan-name">
                            {isPremium ? 'Premium Professional' : 'Free Standard'}
                        </div>
                        <p className="status-desc">
                            {isPremium 
                                ? `Your premium benefits are active until ${new Date(store.subscription_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
                                : 'You are currently on the free tier with basic listing limits.'}
                        </p>
                    </div>
                    <div className="status-visual">
                        {isPremium ? (
                            <div className="days-circle">
                                <span className="days-num">{daysRemaining}</span>
                                <span className="days-label">Days Left</span>
                            </div>
                        ) : (
                            <div className="free-icon-box">
                                <ShieldCheck size={48} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Benefits Grid */}
                <section className="benefits-section">
                    <h2>Premium Benefits</h2>
                    <div className="benefits-grid">
                        <div className="benefit-item">
                            <div className="benefit-icon bg-purple"><Package size={20} /></div>
                            <div className="benefit-text">
                                <h4>Higher Product Limit</h4>
                                <p>List up to 500 products (increase from 50 default limit).</p>
                            </div>
                        </div>
                        <div className="benefit-item">
                            <div className="benefit-icon bg-blue"><Zap size={20} /></div>
                            <div className="benefit-text">
                                <h4>Priority Search Results</h4>
                                <p>Your products appear higher in search results for better visibility.</p>
                            </div>
                        </div>
                        <div className="benefit-item">
                            <div className="benefit-icon bg-orange"><Globe size={20} /></div>
                            <div className="benefit-text">
                                <h4>Hero Banner Campaigns</h4>
                                <p>Promote your store on the platform's home page hero section.</p>
                            </div>
                        </div>
                        <div className="benefit-item">
                            <div className="benefit-icon bg-green"><BarChart3 size={20} /></div>
                            <div className="benefit-text">
                                <h4>Advanced Analytics</h4>
                                <p>Get deep insights into your store traffic and customer behavior.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Upgrade Options */}
                <section className="upgrade-section">
                    <h2>{isPremium ? 'Renew or Extend Plan' : 'Upgrade to Premium'}</h2>
                    <div className="upgrade-grid">
                        <div className="upgrade-card">
                            <h3>1 Month Plan</h3>
                            <div className="price-tag">
                                <span className="currency">₹</span>
                                <span className="amount">599</span>
                                <span className="period">/ month</span>
                            </div>
                            <ul className="plan-features">
                                <li><CheckCircle2 size={16} /> 100 Product Items</li>
                                <li><CheckCircle2 size={16} /> Standard Ad Placement</li>
                                <li><CheckCircle2 size={16} /> Basic Analytics</li>
                            </ul>
                            <button className="btn-upgrade-secondary" onClick={() => alert('Contacting Admin for offline payment via WhatsApp...')}>
                                Choose 1 Month
                            </button>
                        </div>

                        <div className="upgrade-card popular">
                            <div className="popular-badge">BEST VALUE</div>
                            <h3>12 Months Plan</h3>
                            <div className="price-tag">
                                <span className="currency">₹</span>
                                <span className="amount">4,999</span>
                                <span className="period">/ year</span>
                            </div>
                            <ul className="plan-features">
                                <li><CheckCircle2 size={16} /> 500 Product Items</li>
                                <li><CheckCircle2 size={16} /> Priority Ad Placement</li>
                                <li><CheckCircle2 size={16} /> Verified Store Badge</li>
                                <li><CheckCircle2 size={16} /> 24/7 Premium Support</li>
                                <li><CheckCircle2 size={16} /> Zero Transaction Fees</li>
                            </ul>
                            <button className="btn-upgrade-action" onClick={() => alert('Contacting Admin for offline payment via WhatsApp...')}>
                                Choose Annual Plan
                            </button>
                        </div>

                        <div className="upgrade-card">
                            <h3>6 Months Plan</h3>
                            <div className="price-tag">
                                <span className="currency">₹</span>
                                <span className="amount">2,999</span>
                                <span className="period">/ 6 mo</span>
                            </div>
                            <ul className="plan-features">
                                <li><CheckCircle2 size={16} /> 200 Product Items</li>
                                <li><CheckCircle2 size={16} /> Priority Ad Placement</li>
                                <li><CheckCircle2 size={16} /> Standard Support</li>
                                <li><CheckCircle2 size={16} /> Analytics Dashboard</li>
                            </ul>
                            <button className="btn-upgrade-secondary" onClick={() => alert('Contacting Admin for offline payment via WhatsApp...')}>
                                Choose 6 Months
                            </button>
                        </div>
                    </div>
                </section>

                {/* Support/FAQ Footer */}
                <footer className="sub-footer-info">
                    <div className="info-box">
                        <ShieldQuestion size={24} />
                        <div>
                            <h4>Need help with billing?</h4>
                            <p>For custom plans or payment issues, contact our support team directly.</p>
                        </div>
                        <a href="https://wa.me/917304323282" target="_blank" rel="noreferrer" className="btn-link">Contact Support</a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Subscription;
