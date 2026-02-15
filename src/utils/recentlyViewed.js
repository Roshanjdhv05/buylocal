/**
 * Utility to manage recently viewed products in local storage.
 */

const RECENTLY_VIEWED_KEY = 'buyLocal_recently_viewed';
const MAX_RECENT_ITEMS = 10;

/**
 * Adds a product to the recently viewed list.
 * @param {Object} product - The product object to add.
 */
export const addToRecentlyViewed = (product) => {
    if (!product || !product.id) return;

    try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        let recent = stored ? JSON.parse(stored) : [];

        // Remove if already exists to move it to the front
        recent = recent.filter(item => item.id !== product.id);

        // Add to the front
        recent.unshift({
            id: product.id,
            name: product.name,
            price: product.price,
            online_price: product.online_price,
            image: product.image,
            images: product.images,
            image_urls: product.image_urls,
            store_id: product.store_id,
            category: product.category
        });

        // Limit size
        if (recent.length > MAX_RECENT_ITEMS) {
            recent = recent.slice(0, MAX_RECENT_ITEMS);
        }

        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recent));
    } catch (e) {
        console.error('Error saving recently viewed:', e);
    }
};

/**
 * Retrieves the list of recently viewed products.
 * @returns {Array} List of product objects.
 */
export const getRecentlyViewed = () => {
    try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading recently viewed:', e);
        return [];
    }
};
