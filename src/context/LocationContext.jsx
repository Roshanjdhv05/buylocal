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
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await response.json();
                    const city = data.address.city || data.address.town || data.address.village || '';
                    const state = data.address.state || '';

                    const newLocation = { lat, lng, city, state, timestamp: new Date().getTime() };
                    setLocation(newLocation);
                    localStorage.setItem('user_location', JSON.stringify(newLocation));
                    setError(null);
                } catch (err) {
                    console.error('Reverse geocoding error:', err);
                    // Fallback to coordinates only if geocoding fails
                    const newLocation = { lat, lng, city: 'Unknown', state: '', timestamp: new Date().getTime() };
                    setLocation(newLocation);
                    localStorage.setItem('user_location', JSON.stringify(newLocation));
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('Location access denied');
                setLoading(false);
            },
            { timeout: 10000 }
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
