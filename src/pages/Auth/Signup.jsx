import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../services/supabase';
import { MapPin, User, Mail, Lock, ShoppingBag, Store, Navigation, ArrowLeft } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'buyer',
        city: '',
        state: '',
        lat: null,
        lng: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, detecting, success, error

    const { signUp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoogleSignup = async () => {
        try {
            setLoading(true);
            // Save current "from" state to localStorage so it persists through OAuth redirect
            const from = location.state?.from?.pathname || '/';
            localStorage.setItem('oauth_redirect_path', from);
            await signInWithGoogle();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('error');
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLocationStatus('detecting');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));

                // Reverse geocoding (Simplified for demo - in production use a real API like Google/OpenStreetMap)
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const city = data.address.city || data.address.town || data.address.village || '';
                    const state = data.address.state || '';
                    setFormData(prev => ({ ...prev, city, state }));
                    setLocationStatus('success');
                } catch (e) {
                    setLocationStatus('success'); // Still success for lat/lng even if reverse geo fails
                }
            },
            (err) => {
                setLocationStatus('error');
                setError('Please enable location access to complete signup.');
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Signup: Handling submit...');
        if (!formData.lat || !formData.lng) {
            console.warn('Signup: Missing location coordinates');
            setError('Please detect your location first.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Signup: Calling signUp with:', formData.email);
            await signUp(formData.email, formData.password, formData);

            console.log('Signup: signUp resolved, navigating to home');
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err) {
            console.error('Signup: Error occurred:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="auth-nav-top">
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} />
                    <span>Back to Home</span>
                </Link>
            </div>
            <div className="auth-form-header">
                <h2 className="auth-form-title">Join the community</h2>
                <p className="auth-form-subtitle">Create your account to start shopping local.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-refined">
                <div className="auth-input-refined">
                    <input
                        type="text"
                        placeholder="Name"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                </div>

                <div className="auth-input-refined">
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="auth-input-refined">
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div className="auth-location-refined">
                    <button
                        type="button"
                        className={`location-pill-btn ${locationStatus}`}
                        onClick={detectLocation}
                        disabled={locationStatus === 'detecting'}
                    >
                        <Navigation size={14} className={locationStatus === 'detecting' ? 'spin' : ''} />
                        {locationStatus === 'detecting' ? 'Detecting Location...' :
                            locationStatus === 'success' ? `Located: ${formData.city || 'Success'}` : 'Detect My Location'}
                    </button>
                </div>

                {error && <p className="auth-error-refined">{error}</p>}

                <button type="submit" className="auth-submit-refined" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="auth-divider">
                    <span>or continue with</span>
                </div>

                <button
                    type="button"
                    className="auth-google-btn"
                    onClick={handleGoogleSignup}
                    disabled={loading}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                    Continue with Google
                </button>
            </form>

            <div className="auth-switch-refined">
                Already registered? <Link to="/login">Login</Link>
            </div>

            <style>{`
                .auth-form-header { margin-bottom: 2.5rem; text-align: left; }
                .auth-form-title { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
                .auth-form-subtitle { color: #64748b; font-size: 1.1rem; }

                .auth-nav-top {
                    margin-bottom: 2rem;
                }
                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.95rem;
                    transition: color 0.2s;
                }
                .back-link:hover {
                    color: #7c3aed;
                }

                .auth-form-refined { display: flex; flex-direction: column; gap: 1.25rem; }
                
                .auth-input-refined input {
                    width: 100%;
                    padding: 1.2rem 1.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    background: #fff;
                    transition: all 0.2s;
                    color: #1a1a1a;
                }

                .auth-input-refined input:focus {
                    border-color: #7c3aed;
                    outline: none;
                    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
                }

                .auth-location-refined { margin-top: 0.5rem; }
                .location-pill-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    padding: 0.6rem 1.2rem;
                    border-radius: 100px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                    transition: 0.2s;
                }
                .location-pill-btn:hover { background: #e2e8f0; }
                .location-pill-btn.success { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
                
                .auth-error-refined { color: #ef4444; font-size: 0.875rem; font-weight: 500; }

                .auth-submit-refined {
                    margin-top: 1rem;
                    padding: 1.2rem;
                    background: #7c3aed;
                    color: white;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 1rem;
                    box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3);
                    transition: all 0.2s;
                }
                .auth-submit-refined:hover { transform: translateY(-1px); box-shadow: 0 20px 25px -5px rgba(124, 58, 237, 0.4); background: #6d28d9; }
                .auth-submit-refined:active { transform: translateY(0); }
                .auth-submit-refined:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

                .auth-divider {
                    margin: 1.5rem 0;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    color: #94a3b8;
                    font-size: 0.85rem;
                }
                .auth-divider::before, .auth-divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }

                .auth-google-btn {
                    width: 100%;
                    padding: 0.8rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    color: #1e293b;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    transition: all 0.2s;
                }
                .auth-google-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
                .auth-google-btn img { width: 18px; height: 18px; }

                .auth-switch-refined {
                    margin-top: 2.5rem;
                    text-align: center;
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1e293b;
                }
                .auth-switch-refined a {
                    color: #1e293b;
                    text-decoration: underline;
                    margin-left: 5px;
                }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </AuthLayout>
    );
};

export default Signup;
