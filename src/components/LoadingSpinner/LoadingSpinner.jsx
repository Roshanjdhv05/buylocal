import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

const LoadingSpinner = ({ fullPage = false, size = "150px", inline = false }) => {
    const animationUrl = "https://lottie.host/502542a7-642f-4b0e-b101-f1f325aa1f4d/6cAst55jqB.json";
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        fetch(animationUrl)
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error("Error loading Lottie loader:", err));
    }, []);

    const containerStyle = fullPage ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999
    } : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: inline ? '0' : '2rem',
        width: inline ? 'auto' : '100%'
    };

    return (
        <div style={containerStyle}>
            {animationData && (
                <Lottie 
                    animationData={animationData} 
                    loop={true} 
                    style={{ width: size, height: size }} 
                />
            )}
        </div>
    );
};

export default LoadingSpinner;
