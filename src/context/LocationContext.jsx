import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext({});

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(() => {
        const saved = localStorage.getItem('user_location');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        // Auto clear after 3 seconds for non-loading states
        if (type !== 'loading') {
            setTimeout(() => setToast({ message: '', type: 'info' }), 3000);
        }
    };

    const detectLocation = () => {
        console.log('LocationContext: Starting detection...');
        if (loading) {
            console.log('LocationContext: Already loading, skipping.');
            return;
        }

        if (!navigator.geolocation) {
            console.log('LocationContext: Geolocation node not available.');
            const msg = 'Geolocation not supported';
            setError(msg);
            showToast(msg, 'error');
            return;
        }

        setLoading(true);
        setError(null);
        showToast('Detecting your location...', 'loading');

        console.log('LocationContext: Requesting current position...');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                console.log('LocationContext: Coordinates received:', { lat, lng });
                showToast('Position found, identifying city...', 'loading');

                try {
                    console.log('LocationContext: Fetching city name...');
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                        {
                            headers: {
                                'Accept-Language': 'en',
                                'User-Agent': 'ByLocal-App'
                            }
                        }
                    );
                    const data = await response.json();
                    console.log('LocationContext: Geocode success:', data.address);

                    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || 'Unknown City';
                    const state = data.address?.state || '';

                    const newLocation = { lat, lng, city, state, timestamp: new Date().getTime() };
                    setLocation(newLocation);
                    localStorage.setItem('user_location', JSON.stringify(newLocation));
                    setError(null);
                    showToast(`Location updated: ${city}`, 'success');
                } catch (err) {
                    console.error('LocationContext: Geocode fetch failed:', err);
                    const newLocation = { lat, lng, city: 'Unknown', state: '', timestamp: new Date().getTime() };
                    setLocation(newLocation);
                    localStorage.setItem('user_location', JSON.stringify(newLocation));
                    showToast('City not found, showing coordinates', 'info');
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.error('LocationContext: Geolocation error:', { code: err.code, message: err.message });
                let msg = 'Location access denied';
                let type = 'error';

                if (err.code === 1) { // PERMISSION_DENIED
                    msg = 'Please allow location access in your browser settings and try again.';
                } else if (err.code === 3) { // TIMEOUT
                    msg = 'Location request timed out. Trying again with different settings...';
                    // Retry once with high accuracy off and long timeout if not already done
                    detectSimpleLocation();
                    return;
                }

                setError(msg);
                setLoading(false);
                showToast(msg, type);
            },
            { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 } // Request fresh position with high accuracy
        );
    };

    // Fallback for timeout or failure
    const detectSimpleLocation = () => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
                        headers: { 'User-Agent': 'ByLocal-App' }
                    });
                    const data = await response.json();
                    const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
                    const newLocation = { lat, lng, city, state: data.address?.state || '', timestamp: new Date().getTime() };
                    setLocation(newLocation);
                    localStorage.setItem('user_location', JSON.stringify(newLocation));
                    showToast(`Location updated: ${city}`, 'success');
                } catch {
                    const newLocation = { lat, lng, city: 'Unknown', state: '', timestamp: new Date().getTime() };
                    setLocation(newLocation);
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setError('Could not detect location. Please enter manually.');
                setLoading(false);
                showToast('Could not detect location. Please enter manually.', 'error');
            },
            { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 } // More lenient fallback
        );
    };

    useEffect(() => {
        const saved = localStorage.getItem('user_location');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Re-detect if older than 24 hours
            const oneDay = 24 * 60 * 60 * 1000;
            if (new Date().getTime() - parsed.timestamp > oneDay) {
                detectLocation();
            }
        } else {
            // Only auto-detect if we haven't skipped
            const isSkipped = localStorage.getItem('location_skipped') === 'true';
            if (!isSkipped) {
                detectLocation();
            }
        }
    }, []);

    return (
        <LocationContext.Provider value={{ location, loading, error, detectLocation, toast, setToast }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => useContext(LocationContext);
