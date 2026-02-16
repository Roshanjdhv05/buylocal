const SEARCH_HISTORY_KEY = 'buylocal_search_history';

export const getRecentSearches = () => {
    try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (e) {
        console.error('Error reading search history', e);
        return [];
    }
};

export const addRecentSearch = (query) => {
    if (!query) return;
    try {
        let history = getRecentSearches();
        // Remove duplicates and keep only last 10
        history = [query, ...history.filter(q => q !== query)].slice(0, 10);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Error saving search history', e);
    }
};

export const clearSearchHistory = () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
};
