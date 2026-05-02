import React, { useState, useEffect, useRef } from 'react';
import Skeleton from '../Skeleton/Skeleton';

const LazyImage = ({ 
    src, 
    alt, 
    className = '', 
    containerClassName = '', 
    placeholderVariant = 'rect',
    onError,
    ...props 
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        // If image is already cached, it might load immediately
        if (imgRef.current && imgRef.current.complete) {
            setIsLoaded(true);
        }
    }, [src]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = (e) => {
        setHasError(true);
        if (onError) onError(e);
    };

    return (
        <div className={`lazy-image-container ${containerClassName}`} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
            {!isLoaded && !hasError && (
                <Skeleton 
                    variant={placeholderVariant} 
                    width="100%" 
                    height="100%" 
                    className="absolute inset-0 z-0"
                />
            )}
            
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                onLoad={handleLoad}
                onError={handleError}
                className={`${className} ${isLoaded ? 'fade-in' : 'opacity-0'}`}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'opacity 0.5s ease-in-out',
                    opacity: isLoaded ? 1 : 0,
                    ...props.style
                }}
                loading="lazy"
                {...props}
            />
        </div>
    );
};

export default LazyImage;
