import { getDistance } from 'geolib';

/**
 * Calculates distance between two points in kilometers.
 * @param {Object} point1 - { latitude, longitude }
 * @param {Object} point2 - { latitude, longitude }
 * @returns {number} Distance in km
 */
export const calculateDistance = (point1, point2) => {
    if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
        return Infinity;
    }

    const distance = getDistance(
        { latitude: point1.lat, longitude: point1.lng },
        { latitude: point2.lat, longitude: point2.lng }
    );

    return distance / 1000; // Convert meters to km
};

/**
 * Checks if a store is within a certain range.
 * @param {number} distanceKm 
 * @param {number} rangeKm 
 * @returns {boolean}
 */
export const isWithinRange = (distanceKm, rangeKm = 10) => {
    return distanceKm <= rangeKm;
};
