import React from 'react';

const ProductSkeleton = () => {
    return (
        <div className="product-skeleton-page">
            <div className="skeleton-header">
                <div className="container header-inner-skeleton">
                    <div className="skeleton-circle"></div>
                    <div className="skeleton-line logo-skeleton"></div>
                    <div className="skeleton-circle"></div>
                </div>
            </div>

            <div className="container skeleton-body">
                <div className="skeleton-layout">
                    {/* GALLERY SKELETON */}
                    <div className="skeleton-gallery">
                        <div className="skeleton-rect main-img-skeleton"></div>
                        <div className="skeleton-thumbs-row">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="skeleton-rect thumb-skeleton"></div>
                            ))}
                        </div>
                    </div>

                    {/* INFO SKELETON */}
                    <div className="skeleton-info">
                        <div className="skeleton-line title-skeleton"></div>
                        <div className="skeleton-rect rating-skeleton"></div>
                        <div className="skeleton-line vendor-skeleton"></div>

                        <div className="skeleton-rect price-box-skeleton">
                            <div className="skeleton-line price-skeleton"></div>
                            <div className="skeleton-line tax-skeleton"></div>
                        </div>

                        <div className="skeleton-rect features-skeleton"></div>

                        <div className="skeleton-line desc-title-skeleton"></div>
                        <div className="skeleton-line desc-text-skeleton"></div>
                        <div className="skeleton-line desc-text-skeleton"></div>
                    </div>
                </div>
            </div>

            <style>{`
                .product-skeleton-page { background: #fdfdfd; min-height: 100vh; }
                .skeleton-header { height: 64px; background: white; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; }
                .header-inner-skeleton { display: flex; align-items: center; justify-content: space-between; }
                
                .skeleton-circle { width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; position: relative; overflow: hidden; }
                .skeleton-line { height: 16px; background: #f1f5f9; border-radius: 4px; position: relative; overflow: hidden; }
                .skeleton-rect { background: #f1f5f9; border-radius: 12px; position: relative; overflow: hidden; }
                
                .logo-skeleton { width: 100px; }
                
                .skeleton-body { margin-top: 1rem; }
                .skeleton-layout { display: grid; grid-template-columns: 1fr; gap: 2rem; }
                
                @media (min-width: 1024px) {
                    .skeleton-layout { grid-template-columns: 1fr 480px; gap: 5rem; }
                    .logo-skeleton { width: 150px; }
                    .skeleton-circle { width: 44px; height: 44px; }
                }

                .main-img-skeleton { width: 100%; height: 300px; }
                @media (min-width: 1024px) { .main-img-skeleton { height: 500px; } }
                
                .skeleton-thumbs-row { display: flex; gap: 1rem; margin-top: 1rem; }
                .thumb-skeleton { width: 50px; height: 50px; border-radius: 8px; }
                
                .title-skeleton { width: 80%; height: 32px; margin-bottom: 1rem; }
                .rating-skeleton { width: 60px; height: 24px; margin-bottom: 1rem; }
                .vendor-skeleton { width: 40%; margin-bottom: 2rem; }
                
                .price-box-skeleton { height: 120px; padding: 1.5rem; margin-bottom: 2rem; }
                .price-skeleton { width: 120px; height: 40px; margin-bottom: 0.5rem; }
                .tax-skeleton { width: 150px; }
                
                .features-skeleton { height: 80px; margin-bottom: 2.5rem; }
                
                .desc-title-skeleton { width: 140px; height: 20px; margin-bottom: 0.75rem; }
                .desc-text-skeleton { width: 100%; margin-bottom: 0.5rem; }

                /* Shimmer Animation */
                .skeleton-circle::after, .skeleton-line::after, .skeleton-rect::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
                    animation: shimmer 1.5s infinite;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default ProductSkeleton;
