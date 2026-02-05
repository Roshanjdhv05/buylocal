import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../services/supabase';
import { MapPin, User, Mail, Lock, ShoppingBag, Store } from 'lucide-react';

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

    const { signUp } = useAuth();
    const navigate = useNavigate();

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

            console.log('Signup: signUp resolved, navigating based on role:', formData.role);
            if (formData.role === 'seller') {
                navigate('/seller/create-store');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Signup: Error occurred:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box glass-card">
                <h2>Join BuyLocal</h2>
                <p className="auth-subtitle">Discover shops near you</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <User size={18} />
                        <input
                            type="text"
                            placeholder="Username"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <Mail size={18} />
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div className="role-selector">
                        <label className={formData.role === 'buyer' ? 'active' : ''}>
                            <input
                                type="radio"
                                name="role"
                                value="buyer"
                                checked={formData.role === 'buyer'}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            />
                            <ShoppingBag size={20} />
                            <span>Buyer</span>
                        </label>
                        <label className={formData.role === 'seller' ? 'active' : ''}>
                            <input
                                type="radio"
                                name="role"
                                value="seller"
                                checked={formData.role === 'seller'}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            />
                            <Store size={20} />
                            <span>Seller</span>
                        </label>
                    </div>

                    <div className="location-section">
                        <button
                            type="button"
                            className={`btn-location ${locationStatus}`}
                            onClick={detectLocation}
                            disabled={locationStatus === 'detecting'}
                        >
                            <MapPin size={18} />
                            {locationStatus === 'detecting' ? 'Detecting...' :
                                locationStatus === 'success' ? 'Location Detected!' : 'Detect My Location'}
                        </button>
                        {formData.city && (
                            <p className="location-preview">{formData.city}, {formData.state}</p>
                        )}
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Log In</Link>
                </p>
            </div>

            <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--grad-main);
        }
        .auth-box {
          width: 100%;
          max-width: 450px;
          padding: 2.5rem;
          text-align: center;
          background: white;
        }
        h2 { margin-bottom: 0.5rem; font-size: 2rem; color: var(--text-main); }
        .auth-subtitle { color: var(--text-muted); margin-bottom: 2rem; }
        
        .input-group {
          position: relative;
          margin-bottom: 1rem;
        }
        .input-group svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .input-group input {
          padding-left: 3rem;
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .role-selector label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border: 2px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition);
        }
        .role-selector label.active {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.05);
        }
        .role-selector input { display: none; }

        .btn-location {
          width: 100%;
          background: #f1f5f9;
          color: var(--text-main);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .btn-location.success {
          background: #dcfce7;
          color: var(--success);
        }
        .location-preview { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem; }

        .error-message { color: var(--error); font-size: 0.875rem; margin-bottom: 1rem; }
        .auth-submit { width: 100%; margin-top: 1rem; }
        .auth-switch { margin-top: 1.5rem; font-size: 0.9375rem; color: var(--text-muted); }
        .auth-switch a { color: var(--primary); font-weight: 600; }
      `}</style>
        </div>
    );
};

export default Signup;
