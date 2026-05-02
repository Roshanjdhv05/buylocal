import React from 'react';
import Skeleton from './Skeleton';

const SkeletonProductCard = () => {
    return (
        <div className="luxury-product-card" style={{ cursor: 'default' }}>
            <div className="luxury-card-image-wrap">
                <Skeleton variant="rect" height="100%" />
            </div>
            <div className="luxury-product-info">
                <div className="luxury-product-header">
                    <Skeleton variant="text" width="80%" height="1.2rem" />
                    <Skeleton variant="text" width="40%" height="0.8rem" />
                </div>
                <div className="luxury-price-row">
                    <Skeleton variant="text" width="30%" height="1rem" />
                </div>
                <div className="luxury-card-footer">
                    <Skeleton variant="text" width="50%" height="0.6rem" />
                    <Skeleton variant="text" width="20%" height="0.6rem" />
                </div>
            </div>
        </div>
    );
};

export default SkeletonProductCard;
