import React from 'react';

const Skeleton = ({ variant = 'rect', width, height, className = '', style = {} }) => {
    const baseClass = `skeleton skeleton-${variant} ${className}`;
    
    const customStyle = {
        ...style,
        width: width || style.width,
        height: height || style.height
    };

    return <div className={baseClass} style={customStyle} />;
};

export default Skeleton;
