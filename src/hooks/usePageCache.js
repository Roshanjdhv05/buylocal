import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { savePageState, loadPageState } from '../utils/pageCache';

/**
 * Hook to persist and restore page state.
 * @param {Object} options Options for caching
 * @param {string} options.id Optional unique ID for the cache (defaults to pathname)
 * @param {Object} options.initialState Initial state if no cache exists
 * @param {boolean} options.autoRestoreScroll Whether to automatically restore scroll position
 * @param {number} options.debounceMs Time to wait before saving state (default 500ms)
 */
export const usePageCache = ({ 
    id, 
    initialState = {}, 
    autoRestoreScroll = true,
    debounceMs = 500 
} = {}) => {
    const { pathname } = useLocation();
    const cacheKey = id || pathname;
    const saveTimeout = useRef(null);
    const hasRestoredScroll = useRef(false);

    // Load initial state from cache or fallback to initialArg
    const [pageState, setPageState] = useState(() => {
        const cached = loadPageState(cacheKey);
        return cached ? cached.data : initialState;
    });

    // Helper to update state and trigger save
    const updatePageState = useCallback((updates) => {
        setPageState(prev => {
            const newState = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
            
            // Debounced save
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(() => {
                savePageState(cacheKey, newState);
            }, debounceMs);

            return newState;
        });
    }, [cacheKey, debounceMs]);

    // Restore scroll position after mount/content load
    const restoreScroll = useCallback((delay = 100) => {
        if (!autoRestoreScroll || hasRestoredScroll.current) return;

        const cached = loadPageState(cacheKey);
        if (cached && cached.scrollY) {
            setTimeout(() => {
                window.scrollTo({
                    top: cached.scrollY,
                    behavior: 'instant'
                });
                hasRestoredScroll.current = true;
            }, delay);
        }
    }, [cacheKey, autoRestoreScroll]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, []);

    // Also auto-save scroll on window scroll events
    useEffect(() => {
        const handleScroll = () => {
            // We only save the current pageState with the new scrollY
            savePageState(cacheKey, pageState);
        };

        let scrollTimeout;
        const debouncedScroll = () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 500);
        };

        window.addEventListener('scroll', debouncedScroll);
        return () => {
            window.removeEventListener('scroll', debouncedScroll);
            if (scrollTimeout) clearTimeout(scrollTimeout);
        };
    }, [cacheKey, pageState]);

    return { 
        pageState, 
        updatePageState, 
        restoreScroll,
        cacheKey 
    };
};
