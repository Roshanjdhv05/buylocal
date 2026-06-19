import React from 'react';
import { Link } from 'react-router-dom';
import {
    Store, ShoppingBag, Zap, Heart, Smartphone, Handshake,
    ShieldCheck, Star, Users, Search, Lock, TrendingUp,
    Mail, ArrowRight, MapPin
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import './AboutUs.css';

import heroImg from '/about-hero.png';
import visionImg from '/about-vision.png';

const FEATURES = [
    {
        icon: <Store size={24} />,
        title: 'Discover Nearby Stores',
        desc: 'Find trusted local businesses in your area with ease and confidence.'
    },
    {
        icon: <ShoppingBag size={24} />,
        title: 'Shop Local Products',
        desc: 'Browse products from nearby stores — all in one convenient place.'
    },
    {
        icon: <Zap size={24} />,
        title: 'Fast Local Fulfillment',
        desc: 'Get products quickly from businesses located right near you.'
    },
    {
        icon: <Heart size={24} />,
        title: 'Support Local Communities',
        desc: 'Every purchase you make helps strengthen local businesses and entrepreneurs.'
    },
    {
        icon: <Smartphone size={24} />,
        title: 'Modern Shopping Experience',
        desc: 'Simple, fast, and mobile-friendly shopping designed for you.'
    },
    {
        icon: <Handshake size={24} />,
        title: 'Empower Local Sellers',
        desc: 'We provide stores with the tools they need to grow online and thrive.'
    },
];

const WHY_ITEMS = [
    {
        icon: <ShieldCheck size={22} />,
        title: 'Trusted Local Businesses',
        desc: 'We verify and curate local stores so you can shop with confidence.'
    },
    {
        icon: <Star size={22} />,
        title: 'Personalized Experience',
        desc: 'Discover products and stores tailored to your neighborhood and preferences.'
    },
    {
        icon: <Users size={22} />,
        title: 'Community-Driven Marketplace',
        desc: 'Built for communities, by communities. Every store is a neighbor.'
    },
    {
        icon: <Search size={22} />,
        title: 'Easy Product Discovery',
        desc: 'Find what you need quickly with smart search and local filters.'
    },
    {
        icon: <Lock size={22} />,
        title: 'Secure Shopping Experience',
        desc: 'Your data and transactions are always protected with us.'
    },
    {
        icon: <TrendingUp size={22} />,
        title: 'Growing Local Economy',
        desc: 'Supporting local businesses means a stronger economy for everyone.'
    },
];

const AboutUs = () => {
    return (
        <div className="about-us-wrapper">
            <SEO
                title="About Us - ByLocal | Your Neighborhood, Now Online"
                description="ByLocal is a hyperlocal marketplace that connects customers with nearby local stores and businesses. Learn about our story, mission, and vision."
            />
            <Navbar />

            {/* HERO SECTION */}
            <section className="about-hero-section">
                <div className="about-hero-content">
                    <div className="about-hero-badge">About ByLocal</div>
                    <h1 className="about-hero-title">Your Neighborhood,<br />Now Online</h1>
                    <p className="about-hero-subtitle">
                        ByLocal helps customers discover, shop, and support trusted local stores while
                        empowering businesses to grow in their communities.
                    </p>
                    <div className="hero-cta-row">
                        <Link to="/stores" className="btn-primary-purple">
                            Explore Stores <ArrowRight size={18} />
                        </Link>
                        <a href="#contact" className="btn-outline-purple">
                            Contact Us
                        </a>
                    </div>
                </div>
                <div className="about-hero-image-wrap">
                    <img
                        src={heroImg}
                        alt="Local shopping community illustration"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <div className="hero-img-fallback">
                        <div className="hero-pattern">
                            <div className="pattern-circle c1"></div>
                            <div className="pattern-circle c2"></div>
                            <div className="pattern-circle c3"></div>
                            <div className="floating-icon fi1"><Store size={40} /></div>
                            <div className="floating-icon fi2"><ShoppingBag size={32} /></div>
                            <div className="floating-icon fi3"><Heart size={28} /></div>
                            <div className="floating-icon fi4"><MapPin size={32} /></div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="about-stats-row">
                    <div className="about-stat-item">
                        <span className="stat-number">500+</span>
                        <span className="stat-label">Local Stores</span>
                    </div>
                    <div className="about-stat-divider" />
                    <div className="about-stat-item">
                        <span className="stat-number">10K+</span>
                        <span className="stat-label">Happy Customers</span>
                    </div>
                    <div className="about-stat-divider" />
                    <div className="about-stat-item">
                        <span className="stat-number">50+</span>
                        <span className="stat-label">Cities</span>
                    </div>
                </div>
            </section>

            {/* OUR STORY */}
            <section className="about-story-section">
                <div className="about-container">
                    <div className="section-label">Our Journey</div>
                    <h2 className="section-title">Who We Are</h2>
                    <div className="about-story-content">
                        <p>
                            ByLocal is a hyperlocal marketplace built to bring local businesses and customers
                            closer together. Our mission is to help neighborhood stores establish a strong
                            online presence while giving customers a convenient way to discover products and
                            services available nearby.
                        </p>
                        <p>
                            We believe local businesses are the heart of every community. ByLocal makes it
                            easier for customers to support local entrepreneurs while enjoying a seamless
                            shopping experience.
                        </p>
                    </div>
                </div>
            </section>

            {/* WHAT WE DO */}
            <section className="about-features-section">
                <div className="about-container">
                    <div className="section-label">Our Services</div>
                    <h2 className="section-title">What We Do</h2>
                    <p className="section-subtitle">
                        Everything you need to discover and support the local businesses around you.
                    </p>
                    <div className="features-grid">
                        {FEATURES.map((f, idx) => (
                            <div className="feature-card" key={idx}>
                                <div className="feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WHY CHOOSE BYLOCAL */}
            <section className="about-why-section">
                <div className="about-container">
                    <div className="section-label">Why Us</div>
                    <h2 className="section-title">Why Choose ByLocal</h2>
                    <p className="section-subtitle">
                        More than just a marketplace — a community built on trust and local love.
                    </p>
                    <div className="why-grid">
                        {WHY_ITEMS.map((item, idx) => (
                            <div className="why-item" key={idx}>
                                <div className="why-icon">{item.icon}</div>
                                <div>
                                    <h4>{item.title}</h4>
                                    <p>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* OUR VISION */}
            <section className="about-vision-section">
                <div className="about-container vision-inner">
                    <div className="vision-content">
                        <div className="section-label">Looking Ahead</div>
                        <h2 className="section-title" style={{ textAlign: 'left' }}>
                            Building Stronger Local Communities
                        </h2>
                        <p className="vision-text">
                            Our vision is to create a connected ecosystem where local businesses thrive
                            digitally and customers can easily support the stores around them. We aim to
                            make local commerce more accessible, convenient, and sustainable for everyone.
                        </p>
                        <Link to="/stores" className="btn-primary-purple" style={{ marginTop: '2rem', display: 'inline-flex' }}>
                            Discover Local Stores <ArrowRight size={18} />
                        </Link>
                    </div>
                    <div className="vision-image-wrap">
                        <img
                            src={visionImg}
                            alt="Building connected local communities"
                            onError={(e) => {
                                e.target.parentElement.classList.add('img-error');
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* CONTACT US */}
            <section className="about-contact-section" id="contact">
                <div className="about-container">
                    <div className="section-label">Reach Out</div>
                    <h2 className="section-title">Get In Touch</h2>
                    <div className="contact-card">
                        <div className="contact-icon-wrap">
                            <Mail size={32} />
                        </div>
                        <p>
                            We would love to hear from you. Whether you have questions, feedback,
                            partnership opportunities, or support requests, our team is here to help.
                        </p>
                        <a href="mailto:bylocalofficial@gmail.com" className="contact-email-link">
                            <Mail size={16} />
                            bylocalofficial@gmail.com
                        </a>
                        <div style={{ marginTop: '2rem' }}>
                            <a href="mailto:bylocalofficial@gmail.com" className="btn-primary-purple">
                                <Mail size={18} />
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="about-cta-section">
                <div className="about-container">
                    <div className="cta-badge">Join the Movement</div>
                    <h2>Support Local. Shop Smarter.</h2>
                    <p>
                        Join thousands of customers discovering and supporting local businesses
                        through ByLocal.
                    </p>
                    <div className="cta-buttons">
                        <Link to="/stores" className="btn-primary-purple">
                            Explore Stores <ArrowRight size={18} />
                        </Link>
                        <Link to="/categories" className="btn-outline-light">
                            Start Shopping
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
