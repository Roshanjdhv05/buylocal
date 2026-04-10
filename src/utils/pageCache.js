const CACHE_KEY = 'app_page_cache';
const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Save state for a specific page/URL.
 * The cache maps pathnames to their state objects.
 */
export const savePageState = (pathname, state) => {
    try {
        const now = Date.now();
        const currentCache = getFullCache();
        
        // Update the state for this specific pathname
        currentCache[pathname] = {
            data: state,
            timestamp: now,
            scrollY: window.scrollY
        };

        // Cleanup expired entries while we're at it
        const cleanedCache = cleanupExpired(currentCache);
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(cleanedCache));
    } catch (error) {
        console.error('PageCache: Error saving state:', error);
    }
};

/**
 * Load state for a specific page/URL.
 * Returns null if no state exists or it has expired.
 */
export const loadPageState = (pathname) => {
    try {
        const currentCache = getFullCache();
        const entry = currentCache[pathname];

        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > EXPIRY_MS) {
            delete currentCache[pathname];
            localStorage.setItem(CACHE_KEY, JSON.stringify(currentCache));
            return null;
        }

        return entry;
    } catch (error) {
        console.error('PageCache: Error loading state:', error);
        return null;
    }
};

/**
 * Clear the entire page cache.
 * Useful for logout or global resets.
 */
export const clearPageCache = () => {
    localStorage.removeItem(CACHE_KEY);
};

/**
 * Private helpers
 */

const getFullCache = () => {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

const cleanupExpired = (cache) => {
    const now = Date.now();
    const result = { ...cache };
    let hasChanges = false;

    Object.keys(result).forEach(key => {
        if (now - result[key].timestamp > EXPIRY_MS) {
            delete result[key];
            hasChanges = true;
        }
    });

    return result;
};
