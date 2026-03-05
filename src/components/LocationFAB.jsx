import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from '../context/LocationContext';
import { MapPin, Navigation, Loader, X, ChevronUp, ChevronDown } from 'lucide-react';

const LocationFAB = () => {
    const { location, loading, detectLocation } = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);
    const panelRef = useRef(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);

    const handleToggle = () => setIsExpanded(!isExpanded);

    const handleDetect = () => {
        detectLocation();
        // Keep expanded to show progress or auto-close on success if preferred
    };

    return (
        <div className="location-fab-container" ref={panelRef}>
            {isExpanded && (
                <div className="location-panel glass-card">
                    <div className="panel-header">
                        <h3>Location</h3>
                        <button className="close-panel" onClick={() => setIsExpanded(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="panel-content">
                        <div className="current-loc-display">
                            <MapPin size={20} className="loc-pin" />
                            <div className="loc-info">
                                <span className="loc-label">Showing results for:</span>
                                <span className="loc-value">
                                    {loading ? 'Detecting...' : location ? `${location.city}, ${location.state}` : 'Not set'}
                                </span>
                            </div>
                        </div>

                        <button
                            className={`detect-btn-fab ${loading ? 'loading' : ''}`}
                            onClick={handleDetect}
                            disabled={loading}
                        >
                            {loading ? <Loader size={18} className="spinner" /> : <Navigation size={18} />}
                            {loading ? 'Detecting...' : 'Update My Location'}
                        </button>
                    </div>
                </div>
            )}

            <button
                className={`fab-trigger ${isExpanded ? 'active' : ''}`}
                onClick={handleToggle}
                title="Location Settings"
            >
                <MapPin size={24} />
                {location && !isExpanded && (
                    <span className="fab-city-tag">{location.city}</span>
                )}
            </button>

            <style>{`
                .location-fab-container {
                    position: fixed;
                    right: 2rem;
                    bottom: 2rem;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 1rem;
                }

                .fab-trigger {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: #4285F4; /* Google Blue */
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }

                .fab-trigger:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(66, 133, 244, 0.5);
                }

                .fab-trigger.active {
                    background: #3367D6; /* Darker Google Blue */
                    transform: rotate(90deg);
                }

                .fab-city-tag {
                    position: absolute;
                    right: 58px;
                    background: white;
                    color: #1e293b;
                    padding: 0.4rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                    animation: fadeIn 0.3s ease;
                }

                .location-panel {
                    width: 280px;
                    padding: 1.25rem;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    animation: slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes slideInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(10px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.25rem;
                }

                .panel-header h3 {
                    font-size: 1rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0;
                }

                .close-panel {
                    background: #f1f5f9;
                    color: #64748b;
                    padding: 0.25rem;
                    border-radius: 50%;
                }

                .current-loc-display {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    margin-bottom: 1rem;
                    border: 1px solid #e2e8f0;
                }

                .loc-pin { color: #4285F4; flex-shrink: 0; }
                
                .loc-info { display: flex; flex-direction: column; gap: 2px; }
                .loc-label { font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
                .loc-value { font-size: 0.95rem; font-weight: 700; color: #1e293b; }

                .detect-btn-fab {
                    width: 100%;
                    padding: 0.85rem;
                    background: #4285F4;
                    color: white;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.2s ease;
                }

                .detect-btn-fab:hover:not(:disabled) {
                    background: #3367D6;
                    transform: translateY(-1px);
                }

                .detect-btn-fab:disabled { opacity: 0.7; cursor: not-allowed; }

                .spinner { animation: spin 1s linear infinite; }

                @media (max-width: 640px) {
                    .location-fab-container {
                        right: 1.25rem;
                        bottom: 1.25rem;
                    }
                    .location-panel {
                        width: calc(100vw - 2.5rem);
                        max-width: 320px;
                    }
                    .fab-city-tag {
                        display: none; /* Hide tag on mobile to avoid clutter */
                    }
                }
            `}</style>
        </div>
    );
};

export default LocationFAB;
