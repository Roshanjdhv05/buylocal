/**
 * Standardized placeholders for different types of content
 */
export const PLACEHOLDERS = {
    PRODUCT: 'https://placehold.co/600x600/f3f4f6/64748b?text=Product',
    CATEGORY: 'https://placehold.co/400x400/e5e7eb/4b5563?text=Category',
    BANNER: '/defaultbanner.png',
    STORE_LOGO: '/defaultprofile.png'
};

// The Netlify proxy is currently returning 503 Service Unavailable for stored API image requests.
// We intercept and rewrite the URLs back to the raw Supabase URL to restore all images instantly.
const fixProxyUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    
    // Direct Supabase host for reliable image serving
    const SUPABASE_HOST = 'ohnumyohkpwlkcogwotj.supabase.co';
    
    // If the URL is already direct or isn't a proxy URL, return as is
    if (url.includes(SUPABASE_HOST)) return url;

    // List of known proxy origins to strip away for images
    const PROXIES = [
        'bylocal.netlify.app/api/supabase',
        'buylocal-supabase-proxy.workers.dev',
        'vercel.app/api/supabase',
        window.location.host + '/api/supabase'
    ];

    let fixedUrl = url;
    PROXIES.forEach(proxy => {
        if (fixedUrl.includes(proxy)) {
            // Extract the path after the proxy (e.g. /storage/v1/object/public/...)
            const parts = fixedUrl.split(proxy);
            if (parts.length > 1) {
                fixedUrl = `https://${SUPABASE_HOST}${parts[1]}`;
            }
        }
    });

    return fixedUrl;
};

/**
 * Resolves a product's primary image from various possible database fields
 * @param {Object} product 
 * @returns {string}
 */
export const getProductImage = (product) => {
    if (!product) return PLACEHOLDERS.PRODUCT;
    
    // Check images array
    if (Array.isArray(product.images) && product.images.length > 0) {
        const first = product.images[0];
        if (typeof first === 'string' && first.trim() !== '') return fixProxyUrl(first);
    }
    
    // Check image_urls array
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        const first = product.image_urls[0];
        if (typeof first === 'string' && first.trim() !== '') return fixProxyUrl(first);
    }
    
    // Check single image field
    if (typeof product.image === 'string' && product.image.trim() !== '') {
        return fixProxyUrl(product.image);
    }

    // Check single image_url field
    if (typeof product.image_url === 'string' && product.image_url.trim() !== '') {
        return fixProxyUrl(product.image_url);
    }

    return PLACEHOLDERS.PRODUCT;
};

/**
 * Checks if a URL is valid and provides a fallback
 */
export const resolveImageUrl = (url, type = 'PRODUCT') => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return PLACEHOLDERS[type] || PLACEHOLDERS.PRODUCT;
    }
    return fixProxyUrl(url);
};
