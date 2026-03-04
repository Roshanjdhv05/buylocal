import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext({});

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(() => {
        const saved = localStorage.getItem('user_location');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const detectLocation = () => {
        console.log('LocationContext: Starting detection...');
        if (loading) {
            console.log('LocationContext: Already loading, skipping.');
            return;
        }

        if (!navigator.geolocation) {
            console.log('LocationContext: Geolocation node not available.');
            setError('Geolocation not supported');
            return;
        }

        setLoading(true);
        setError(null);

        console.log('LocationContext: Requesting current position...');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                console.log('LocationContext: Coordinates received:', { lat, lng });

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
                } catch (err) {
                    console.error('LocationContext: Geocode fetch failed:', err);
                    const newLocation = { lat, lng, city: 'Unknown', state: '', timestamp: new Date().getTime() };
                    setLocation(newLocation);
                    localStorage.setItem('user_location', JSON.stringify(newLocation));
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.error('LocationContext: Geolocation error:', { code: err.code, message: err.message });
                let msg = 'Location access denied';
                if (err.code === 3) msg = 'Location request timed out';
                setError(msg);
                setLoading(false);
            },
            { timeout: 15000, enableHighAccuracy: false }
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
            detectLocation();
        }
    }, []);

    return (
        <LocationContext.Provider value={{ location, loading, error, detectLocation }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => useContext(LocationContext);
