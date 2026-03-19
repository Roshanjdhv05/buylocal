import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ShoppingBag, Apple, Carrot, Package, Gift, Sparkles, MapPin, Store } from 'lucide-react';
import Lottie from 'lottie-react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete, isLoading = false }) => {
    const animationUrl = "https://lottie.host/95226b1f-91be-498e-b351-ebc8fc7a55c0/WHvKiOo252.json";
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        fetch(animationUrl)
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error("Error loading Lottie animation:", err));
    }, []);

    const [animationStage, setAnimationStage] = useState('initial');
    const [animationComplete, setAnimationComplete] = useState(false);
    const basketControls = useAnimation();

    // Floating background particles
    const particles = Array.from({ length: 15 });

    useEffect(() => {
        const runAnimation = async () => {
            // Stage 1: Basket appears
            await new Promise(resolve => setTimeout(resolve, 300));
            setAnimationStage('basket-ready');
            
            // Stage 2: Items drop one by one
            await new Promise(resolve => setTimeout(resolve, 400));
            setAnimationStage('dropping-items');

            // Wait for items to finish dropping
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            // Stage 3: Logo and text reveal
            setAnimationStage('text-reveal');

            // Stage 4: Wait to be readable before allowing dismissal
            await new Promise(resolve => setTimeout(resolve, 1200));
            setAnimationComplete(true);
        };

        runAnimation();
    }, []);

    useEffect(() => {
        if (animationComplete && !isLoading && onComplete) {
            onComplete();
        }
    }, [animationComplete, isLoading, onComplete]);

    // When items drop, make the basket bounce slightly
    useEffect(() => {
        if (animationStage === 'dropping-items') {
            const bounceSequence = async () => {
                for (let i = 0; i < 4; i++) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await basketControls.start({
                        y: [0, 8, 0],
                        scale: [1, 1.05, 1],
                        transition: { duration: 0.2, type: 'spring', stiffness: 300 }
                    });
                }
            };
            bounceSequence();
        }
    }, [animationStage, basketControls]);

    const items = []; // No longer needed for dropping animation

    return (
        <motion.div 
            className="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            {/* Background Ambient Glows */}
            <div className="ambient-glow glow-1"></div>
            <div className="ambient-glow glow-2"></div>
            <div className="ambient-glow glow-3"></div>

            {/* Floating Background Elements */}
            <div className="floating-particles">
                {particles.map((_, i) => {
                    const randomType = i % 3;
                    const styleClass = `particle p-${i}`;
                    return (
                        <motion.div
                            key={i}
                            className={styleClass}
                            initial={{ y: 0, opacity: 0 }}
                            animate={{
                                y: [-20, -100],
                                opacity: [0, 0.4, 0],
                                rotate: [0, 360] // slowly rotate
                            }}
                            transition={{
                                duration: 3 + Math.random() * 4,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: "linear"
                            }}
                        >
                            {randomType === 0 && <MapPin size={12} />}
                            {randomType === 1 && <Store size={12} />}
                            {randomType === 2 && <Sparkles size={12} />}
                        </motion.div>
                    );
                })}
            </div>

            <div className="splash-content">
                <div className="animation-container" style={{ margin: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <motion.div
                        className="lottie-container"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={animationStage !== 'initial' ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                        {animationData && (
                            <Lottie 
                                animationData={animationData} 
                                loop={true} 
                                style={{ 
                                    maxWidth: '400px', 
                                    width: '100%', 
                                    height: 'auto',
                                    filter: 'drop-shadow(0 15px 20px rgba(124, 58, 237, 0.2))'
                                }} 
                            />
                        )}
                    </motion.div>
                </div>

                {/* Text Reveal Area */}
                <motion.div 
                    className="text-reveal-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={animationStage === 'text-reveal' ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <motion.h1 
                        className="brand-logo-text"
                        initial={{ letterSpacing: "10px", opacity: 0, scale: 0.9 }}
                        animate={animationStage === 'text-reveal' ? { letterSpacing: "0px", opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 1, type: "spring", stiffness: 100 }}
                    >
                        ByLocal
                    </motion.h1>
                    
                    <motion.p 
                        className="brand-tagline"
                        initial={{ opacity: 0, y: 15 }}
                        animate={animationStage === 'text-reveal' ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        Support local. Discover more.
                    </motion.p>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default SplashScreen;
