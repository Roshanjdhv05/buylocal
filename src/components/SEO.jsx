import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Reusable SEO component for standardizing meta tags and structured data across the app.
 * @param {string} title - The page title.
 * @param {string} description - The meta description.
 * @param {string} canonicalUrl - The canonical URL of the page.
 * @param {string} ogUrl - The Open Graph URL.
 * @param {string} ogImage - The Open Graph image URL.
 * @param {string} ogType - The Open Graph type (e.g., 'website', 'product', 'profile').
 * @param {object|string} schema - The JSON-LD schema object to inject.
 */
const SEO = ({
    title = 'BuyLocal - Shop Local Stores Online',
    description = 'Discover and shop from local stores near you with fast delivery on BuyLocal.',
    canonicalUrl,
    ogUrl,
    ogImage = 'https://buylocal.in/logo.png', // Replace with a default image URL
    ogType = 'website',
    schema
}) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            
            {/* Open Graph Tags */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={ogType} />
            {ogUrl && <meta property="og:url" content={ogUrl} />}
            {ogImage && <meta property="og:image" content={ogImage} />}
            
            {/* Twitter Card Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            {ogImage && <meta name="twitter:image" content={ogImage} />}
            
            {/* Canonical Link */}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
            
            {/* Structured Schema (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {typeof schema === 'string' ? schema : JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
