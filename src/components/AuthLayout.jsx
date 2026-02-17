import React from 'react';
import { ShieldCheck, CheckCircle } from 'lucide-react';

const AuthLayout = ({ children }) => {
    return (
        <div className="auth-split-container">
            {/* Left Pane - Brand focused */}
            <div className="auth-brand-pane">
                <div className="brand-pane-content">
                    <div className="auth-logo-wrap">
                        <img src="/logo.png" alt="ByLocal" className="auth-logo-img" />
                    </div>

                    <h1 className="auth-hero-title">
                        Shop Local.<br />
                        Trust More.
                    </h1>

                    <p className="auth-hero-subtitle">
                        Discover verified nearby stores, transparent pricing, and faster local deliveries — all in one trusted place.
                    </p>

                    <div className="auth-trust-badges">
                        <div className="trust-badge">
                            <ShieldCheck size={18} />
                            <span>SECURE DATA</span>
                        </div>
                        <div className="trust-badge">
                            <CheckCircle size={18} />
                            <span>VERIFIED LOCAL</span>
                        </div>
                    </div>
                </div>

                {/* Decorative floating icons (SVG placeholders or simple divs) */}
                <div className="auth-deco deco-1"></div>
                <div className="auth-deco deco-2"></div>
                <div className="auth-deco deco-3"></div>
                <div className="auth-deco deco-4"></div>
            </div>

            {/* Right Pane - Form focused */}
            <div className="auth-form-pane">
                <div className="form-pane-content">
                    {children}

                    <div className="auth-footer-copy">
                        <p>© 2024 ByLocal Inc. All rights reserved.</p>
                        <div className="auth-footer-links">
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .auth-split-container {
                    display: flex;
                    min-height: 100vh;
                    width: 100%;
                    background: white;
                }

                /* Left Pane Styling */
                .auth-brand-pane {
                    flex: 1.1;
                    background: #7c2d12; /* Fallback */
                    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    padding: 4rem;
                }

                .brand-pane-content {
                    position: relative;
                    z-index: 10;
                    max-width: 500px;
                }

                .auth-logo-wrap {
                    margin-bottom: 3rem;
                }

                .auth-logo-img {
                    height: 40px;
                    filter: brightness(0) invert(1); /* Make logo white */
                }

                .auth-hero-title {
                    font-size: 5rem;
                    line-height: 1.1;
                    font-weight: 800;
                    margin-bottom: 2rem;
                    letter-spacing: -0.02em;
                }

                .auth-hero-subtitle {
                    font-size: 1.25rem;
                    line-height: 1.6;
                    opacity: 0.9;
                    margin-bottom: 4rem;
                }

                .auth-trust-badges {
                    display: flex;
                    gap: 2.5rem;
                }

                .trust-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.75rem;
                    font-weight: 800;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                }

                /* Right Pane Styling */
                .auth-form-pane {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem;
                }

                .form-pane-content {
                    width: 100%;
                    max-width: 420px;
                    display: flex;
                    flex-direction: column;
                }

                .auth-footer-copy {
                    margin-top: 4rem;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.8rem;
                }

                .auth-footer-links {
                    margin-top: 0.5rem;
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                }

                .auth-footer-links a:hover {
                    color: #6d28d9;
                }

                /* Decorative Elements */
                .auth-deco {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    pointer-events: none;
                }

                .deco-1 { width: 100px; height: 100px; top: 10%; left: 5%; transform: rotate(15deg); }
                .deco-2 { width: 80px; height: 80px; bottom: 15%; right: 10%; transform: rotate(-10deg); }
                .deco-3 { width: 60px; height: 60px; top: 40%; right: 5%; transform: rotate(45deg); }
                .deco-4 { width: 120px; height: 120px; bottom: 5%; left: 15%; transform: rotate(-20deg); }

                @media (max-width: 1100px) {
                    .auth-hero-title { font-size: 3.5rem; }
                }

                @media (max-width: 900px) {
                    .auth-split-container { flex-direction: column; }
                    .auth-brand-pane { display: none; } /* Hide left pane on mobile to follow standard patterns */
                    .auth-form-pane { padding: 2rem; min-height: 100vh; }
                }
            `}</style>
        </div>
    );
};

export default AuthLayout;
