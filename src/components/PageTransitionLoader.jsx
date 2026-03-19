import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

const PageTransitionLoader = () => {
    const [animationData, setAnimationData] = useState(null);
    const animationUrl = "https://lottie.host/502542a7-642f-4b0e-b101-f1f325aa1f4d/6cAst55jqB.json";

    useEffect(() => {
        fetch(animationUrl)
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error("Error loading PageTransition Lottie:", err));
    }, []);

    if (!animationData) return null;

    return (
        <div className="page-transition-overlay">
            <div className="lottie-container">
                <Lottie 
                    animationData={animationData} 
                    loop={true}
                    style={{ width: 150, height: 150 }}
                />
            </div>
            <style>{`
                .page-transition-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(5px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                .lottie-container {
                    background: white;
                    padding: 2rem;
                    border-radius: 50%;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default PageTransitionLoader;
