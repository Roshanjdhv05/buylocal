import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const InstallPWA = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            console.log("PWA Install Prompt Triggered");
            setSupportsPWA(true);
            setPromptInstall(e);
        };
        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const onClick = async (evt) => {
        evt.preventDefault();
        if (!promptInstall) {
            return;
        }
        
        // Trigger the browser's native install prompt
        promptInstall.prompt();
        
        // Wait for usage to respond to the prompt
        const { outcome } = await promptInstall.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        // The prompt can only be used once, so clear it out
        setPromptInstall(null);
        setSupportsPWA(false);
    };

    if (!supportsPWA) {
        return null;
    }

    return (
        <div className="install-banner">
            <div className="install-content">
                <div className="install-left">
                    <img src="/favicon.png" alt="ByLocal" className="install-icon" />
                    <div className="install-text">
                        <span className="install-title">Install ByLocal</span>
                        <span className="install-subtitle">Your Neighborhood Shop</span>
                    </div>
                </div>
                <button className="btn-install-main" onClick={onClick}>Install</button>
                <button className="btn-dismiss-x" onClick={() => setSupportsPWA(false)} aria-label="Close">
                    <X size={16} />
                </button>
            </div>
            <style>{`
                .install-banner {
                    position: fixed;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 94%;
                    max-width: 480px;
                    background: white;
                    padding: 10px 16px;
                    border-radius: 20px;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                    z-index: 9999;
                    border: 1px solid rgba(0,0,0,0.05);
                    animation: bannerSlideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .install-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                }
                .install-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .install-icon {
                    width: 48px;
                    height: 48px;
                    object-fit: cover;
                    border-radius: 12px;
                    background: #f8fafc;
                }
                .install-text {
                    display: flex;
                    flex-direction: column;
                }
                .install-title {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: var(--text-main, #1e293b);
                    line-height: 1.2;
                }
                .install-subtitle {
                    font-size: 0.75rem;
                    color: var(--text-muted, #64748b);
                    line-height: 1.2;
                }
                .btn-install-main {
                    background: none;
                    color: var(--accent-blue, #3b82f6);
                    font-weight: 700;
                    font-size: 0.9rem;
                    padding: 10px 14px;
                    border: none;
                    cursor: pointer;
                    margin-left: auto;
                    margin-right: 15px;
                }
                .btn-dismiss-x {
                    position: absolute;
                    top: -12px;
                    right: -12px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #1e293b;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                    cursor: pointer;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                @keyframes bannerSlideDown {
                    from { 
                        opacity: 0;
                        transform: translate(-50%, -40px);
                    }
                    to { 
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                }
            `}</style>
        </div>
    );
};

export default InstallPWA;
