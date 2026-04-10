import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, ArrowUp, ExternalLink } from 'lucide-react';

const InstallPWA = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsStandalone(standalone);

        // Check if user has dismissed it this session
        const dismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
        setIsDismissed(dismissed);

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        const handler = (e) => {
            e.preventDefault();
            console.log("PWA Install Prompt Triggered");
            setSupportsPWA(true);
            setPromptInstall(e);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // On iOS, we show the banner if not standalone and not dismissed
        if (ios && !standalone && !dismissed) {
            setSupportsPWA(true);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const onClick = async (evt) => {
        evt.preventDefault();
        
        if (isIOS) {
            setShowInstructions(true);
            return;
        }

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

    const handleDismiss = () => {
        setSupportsPWA(false);
        sessionStorage.setItem('pwa_banner_dismissed', 'true');
    };

    // Don't show if already installed, dismissed, or PWA isn't supported/triggered
    if (isStandalone || isDismissed || !supportsPWA) {
        return null;
    }

    return (
        <>
            <div className="install-banner">
                <div className="install-content">
                    <div className="install-left">
                        <img src="/favicon.png" alt="ByLocal" className="install-icon" />
                        <div className="install-text">
                            <span className="install-title">Install ByLocal</span>
                            <span className="install-subtitle">{isIOS ? 'Add to Home Screen' : 'Your Neighborhood Shop'}</span>
                        </div>
                    </div>
                    <button className="btn-install-main" onClick={onClick}>
                        {isIOS ? 'How to Install' : 'Install'}
                    </button>
                    <button className="btn-dismiss-x" onClick={handleDismiss} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* iOS Instructions Modal */}
            {showInstructions && (
                <div className="pwa-modal-overlay" onClick={() => setShowInstructions(false)}>
                    <div className="pwa-modal" onClick={e => e.stopPropagation()}>
                        <div className="pwa-modal-header">
                            <h3>Install on iPhone/iPad</h3>
                            <button onClick={() => setShowInstructions(false)}><X size={20} /></button>
                        </div>
                        <div className="pwa-modal-body">
                            <ol className="pwa-steps">
                                <li>
                                    <span className="step-icon"><Share size={18} /></span>
                                    <span>Tap the <strong>Share</strong> button in the browser toolbar below.</span>
                                </li>
                                <li>
                                    <span className="step-icon"><ArrowUp size={18} /></span>
                                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong>.</span>
                                </li>
                                <li>
                                    <span className="step-icon"><PlusSquare size={18} /></span>
                                    <span>Tap <strong>Add</strong> in the top right corner to finish.</span>
                                </li>
                            </ol>
                            <div className="pwa-modal-footer">
                                <button className="btn-close-modal" onClick={() => setShowInstructions(false)}>Got it!</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .install-banner {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 92%;
                    max-width: 480px;
                    background: white;
                    padding: 12px 16px;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    border: 1px solid rgba(0,0,0,0.08);
                    animation: bannerSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
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
                    width: 44px;
                    height: 44px;
                    object-fit: cover;
                    border-radius: 10px;
                    background: #f8fafc;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .install-text {
                    display: flex;
                    flex-direction: column;
                }
                .install-title {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #1e293b;
                    line-height: 1.2;
                }
                .install-subtitle {
                    font-size: 0.75rem;
                    color: #64748b;
                    line-height: 1.2;
                }
                .btn-install-main {
                    background: var(--primary, #6366f1);
                    color: white;
                    font-weight: 700;
                    font-size: 0.85rem;
                    padding: 10px 18px;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    margin-left: auto;
                    margin-right: 15px;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }
                .btn-install-main:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
                }
                .btn-dismiss-x {
                    position: absolute;
                    top: -24px;
                    right: -10px;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: #1e293b;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                    cursor: pointer;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                }

                /* Modal Styles */
                .pwa-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                    padding: 20px;
                    animation: fadeIn 0.3s ease;
                }
                .pwa-modal {
                    background: white;
                    width: 100%;
                    max-width: 400px;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .pwa-modal-header {
                    padding: 20px 24px;
                    background: #f8fafc;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #f1f5f9;
                }
                .pwa-modal-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1e293b;
                }
                .pwa-modal-header button {
                    background: none; border: none; color: #64748b; cursor: pointer;
                }
                .pwa-modal-body {
                    padding: 24px;
                }
                .pwa-steps {
                    list-style: none;
                    padding: 0; margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .pwa-steps li {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    font-size: 0.95rem;
                    color: #334155;
                    line-height: 1.5;
                }
                .step-icon {
                    width: 36px; height: 36px;
                    background: #eef2ff;
                    color: #6366f1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    flex-shrink: 0;
                }
                .pwa-modal-footer {
                    margin-top: 30px;
                    display: flex;
                    justify-content: center;
                }
                .btn-close-modal {
                    background: #1e293b;
                    color: white;
                    border: none;
                    border-radius: 100px;
                    padding: 12px 32px;
                    font-weight: 700;
                    font-size: 0.95rem;
                    cursor: pointer;
                    width: 100%;
                }

                @keyframes bannerSlideUp {
                    from { opacity: 0; transform: translate(-50%, 40px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </>
    );
};

export default InstallPWA;
