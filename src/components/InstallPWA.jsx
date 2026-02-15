import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            console.log("we are being triggered :D");
            setSupportsPWA(true);
            setPromptInstall(e);
        };
        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("transitionend", handler);
    }, []);

    const onClick = (evt) => {
        evt.preventDefault();
        if (!promptInstall) {
            return;
        }
        promptInstall.prompt();
    };

    if (!supportsPWA) {
        return null;
    }

    return (
        <div className="install-banner">
            <div className="install-content">
                <img src="/favicon.png" alt="ByLocal" className="install-icon" />
                <div className="install-text">
                    <span className="install-title">Install ByLocal</span>
                    <span className="install-desc">Add to home screen for faster access.</span>
                </div>
                <div className="install-actions">
                    <button className="btn-text" onClick={() => setSupportsPWA(false)}>Not now</button>
                    <button className="btn-primary-sm" onClick={onClick}>Install</button>
                </div>
            </div>
            <style>{`
                .install-banner {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90%;
                    max-width: 400px;
                    background: white;
                    padding: 1.5rem;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    z-index: 9999;
                    border: 1px solid var(--border);
                    animation: popupAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .install-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    align-items: center;
                    text-align: center;
                }
                .install-icon {
                    width: 64px;
                    height: 64px;
                    object-fit: contain;
                    border-radius: 12px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }
                .install-text {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .install-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--text-main);
                }
                .install-desc {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }
                .install-actions {
                    display: flex;
                    gap: 1rem;
                    width: 100%;
                    justify-content: center;
                }
                .btn-text {
                    background: none;
                    color: var(--text-muted);
                    font-weight: 600;
                    font-size: 0.9rem;
                    padding: 0.5rem 1rem;
                }
                .btn-text:hover {
                    color: var(--text-main);
                }
                .btn-primary-sm {
                    background: var(--grad-main);
                    color: white;
                    padding: 0.6rem 1.5rem;
                    border-radius: 99px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    box-shadow: var(--shadow-sm);
                    flex: 1;
                    max-width: 150px;
                }
                @keyframes popupAppear {
                    from { 
                        opacity: 0;
                        transform: translate(-50%, -20px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translate(-50%, 0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default InstallPWA;
