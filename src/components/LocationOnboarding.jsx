import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { MapPin, Navigation, Loader } from 'lucide-react';

const LocationOnboarding = () => {
    const { user, profile, updateProfile, loading: authLoading } = useAuth();
    const { location: ctxLocation, loading: locLoading, error: locError, detectLocation: ctxDetectLocation } = useLocation();
    const [isVisible, setIsVisible] = useState(false);
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, saved, error
    const [error, setError] = useState('');

    useEffect(() => {
        // Show onboarding only if:
        // 1. Auth is loaded
        // 2. User has no location in profile (if logged in) or in localStorage (if guest)
        if (!authLoading) {
            const hasProfileLocation = profile && (profile.city || profile.state);
            const savedLocation = localStorage.getItem('user_location');
            const hasSavedLocation = !!savedLocation;
            const isSkipped = localStorage.getItem('location_skipped') === 'true';

            if (!hasProfileLocation && !hasSavedLocation && !isSkipped) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        }
    }, [authLoading, profile]);

    // Sync from context if detected there
    useEffect(() => {
        if (ctxLocation) {
            setCity(ctxLocation.city || '');
            setState(ctxLocation.state || '');
            setLat(ctxLocation.lat);
            setLng(ctxLocation.lng);
            if (ctxLocation.city) setStatus('success');
        }
    }, [ctxLocation]);

    const handleDetect = () => {
        setStatus('detecting');
        ctxDetectLocation();
    };

    // Update internal status based on context loading/error
    useEffect(() => {
        if (!locLoading && status === 'detecting') {
            if (locError) {
                setStatus('error');
                setError(locError);
            } else if (ctxLocation) {
                setStatus('success');
            } else {
                setStatus('idle');
            }
        }
    }, [locLoading, locError, ctxLocation, status]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!city || !state) {
            setError('Please provide both city and state.');
            return;
        }

        setStatus('saving');
        try {
            if (user) {
                await updateProfile({
                    city,
                    state,
                    lat,
                    lng
                });
            } else {
                // For guest users, save to localStorage
                localStorage.setItem('user_location', JSON.stringify({
                    city,
                    state,
                    lat,
                    lng,
                    timestamp: new Date().getTime()
                }));
                // Wait a bit to simulate saving experience
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            setIsVisible(false);
        } catch (err) {
            setError(err.message);
            setStatus('error');
        }
    };

    if (!isVisible) return null;

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-card glass-card">
                <div className="onboarding-header">
                    <div className="icon-circle">
                        <MapPin size={24} color="var(--primary)" />
                    </div>
                    <h2>Welcome to BuyLocal!</h2>
                    <p>To show you the best shops nearby, we need your location.</p>
                </div>

                <form onSubmit={handleSave} className="onboarding-form">
                    <button
                        type="button"
                        className={`detect-btn ${status === 'detecting' ? 'loading' : ''}`}
                        onClick={handleDetect}
                        disabled={status === 'detecting' || status === 'saving'}
                    >
                        {status === 'detecting' ? <Loader className="spinner" size={18} /> : <Navigation size={18} />}
                        {status === 'success' ? 'Location Detected!' : 'Detect My Location'}
                    </button>

                    <div className="input-row">
                        <input
                            type="text"
                            placeholder="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="State"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="error-msg">{error}</p>}

                    <button
                        type="submit"
                        className="btn-primary start-btn"
                        disabled={status === 'detecting' || status === 'saving'}
                    >
                        {status === 'saving' ? 'Saving...' : 'Start Shopping'}
                    </button>

                    <button
                        type="button"
                        className="skip-btn"
                        onClick={() => {
                            localStorage.setItem('location_skipped', 'true');
                            setIsVisible(false);
                        }}
                    >
                        Browse without location
                    </button>
                </form>
            </div>

            <style>{`
                .onboarding-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(8px);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                }
                .onboarding-card {
                    max-width: 450px;
                    width: 100%;
                    padding: 2.5rem;
                    text-align: center;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .icon-circle {
                    width: 64px; height: 64px;
                    background: #f1f5f9;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.5rem;
                }
                .onboarding-header h2 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.75rem; }
                .onboarding-header p { color: #64748b; font-size: 1rem; line-height: 1.5; margin-bottom: 2rem; }
                
                .onboarding-form { display: flex; flex-direction: column; gap: 1rem; }
                .detect-btn {
                    display: flex; align-items: center; justify-content: center; gap: 0.75rem;
                    padding: 0.85rem; border: 1px dashed #6366f1;
                    background: #f5f3ff; color: #6366f1;
                    border-radius: 12px; font-weight: 600;
                    transition: all 0.2s ease;
                }
                .detect-btn:hover:not(:disabled) { background: #ede9fe; transform: translateY(-1px); }
                
                .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                .input-row input {
                    padding: 0.75rem 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.95rem;
                }
                
                .start-btn { 
                    width: 100%; 
                    padding: 1rem; 
                    margin-top: 0.5rem;
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    color: white;
                    border-radius: 12px;
                    font-weight: 700;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }
                
                .skip-btn {
                    background: none;
                    border: none;
                    color: #64748b;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-top: 0.5rem;
                    cursor: pointer;
                    text-decoration: underline;
                }
                .skip-btn:hover { color: var(--primary); }

                .error-msg { color: #ef4444; font-size: 0.85rem; font-weight: 500; }
                
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 480px) {
                    .onboarding-card { padding: 1.5rem; }
                    .onboarding-header h2 { font-size: 1.5rem; }
                    .input-row { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default LocationOnboarding;
