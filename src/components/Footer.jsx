import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Globe } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <Link to="/" className="logo"><img src="/logo.png" alt="ByLocal" className="logo-img" /></Link>
                        <p>Connecting you with local merchants for a faster, more sustainable shopping experience. Shop small, dream big.</p>
                    </div>

                    <div className="footer-links">
                        <div className="footer-column">
                            <h3>Company</h3>
                            <Link to="/about">About Us</Link>
                            <Link to="/careers">Careers</Link>
                            <Link to="/press">Press</Link>
                            <Link to="/blog">Blog</Link>
                        </div>
                        <div className="footer-column">
                            <h3>Support</h3>
                            <Link to="/help">Help Center</Link>
                            <Link to="/safety">Safety</Link>
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/privacy">Privacy Policy</Link>
                        </div>
                        <div className="footer-column">
                            <h3>Social</h3>
                            <div className="social-icons">
                                <a href="#" className="social-icon"><Facebook size={20} /></a>
                                <a href="#" className="social-icon"><Instagram size={20} /></a>
                                <a href="#" className="social-icon"><Twitter size={20} /></a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} BuyLocal Marketplace. All rights reserved. Locally sourced. Faster delivery. Better quality.</p>
                </div>
            </div>

            <style>{`
                .footer {
                    background: white;
                    padding: 5rem 0 2rem;
                    border-top: 1px solid var(--border);
                    margin-top: auto;
                }
                .logo-img {
                    height: 50px;
                    width: auto;
                    display: block;
                    margin-bottom: 1rem;
                }
                .footer-brand p {
                    color: var(--text-muted);
                    margin-top: 1rem;
                    max-width: 300px;
                    line-height: 1.6;
                }
                .footer-links {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2rem;
                }
                .footer-column h3 {
                    font-size: 0.875rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: var(--text-main);
                }
                .footer-column a {
                    display: block;
                    color: var(--text-muted);
                    margin-bottom: 0.75rem;
                    font-size: 0.875rem;
                    transition: var(--transition);
                }
                .footer-column a:hover {
                    color: var(--primary);
                }
                .social-icons {
                    display: flex;
                    gap: 1rem;
                }
                .social-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--background);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-main);
                    transition: var(--transition);
                }
                .social-icon:hover {
                    background: var(--primary);
                    color: white;
                }
                .footer-bottom {
                    border-top: 1px solid var(--border);
                    padding-top: 2rem;
                    text-align: center;
                    color: var(--text-muted);
                    font-size: 0.75rem;
                }
                
                @media (max-width: 768px) {
                    .footer-content {
                        grid-template-columns: 1fr;
                        gap: 3rem;
                    }
                    .footer-links {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </footer>
    );
};

export default Footer;
