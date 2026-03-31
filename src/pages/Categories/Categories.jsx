import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLocation } from '../../context/LocationContext';
import {
    ShoppingBag,
    ArrowRight,
    Store,
    MapPin,
    ChevronRight,
    ChevronDown,
    Search,
    Filter,
    LayoutGrid,
    ChevronLeft,
    ArrowLeft,
    Star,
    Shirt,
    Palette,
    Monitor,
    Smartphone,
    Gem,
    Footprints,
    Gamepad2,
    Armchair,
    Laptop,
    Tv,
    Wind,
    Headphones,
    Tablet,
    Watch,
    Printer,
    Battery,
    Activity,
    Package
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const Categories = () => {
    const { t } = useTranslation();
    const { categoryName } = useParams();
    const navigate = useNavigate();

    const [expandedCats, setExpandedCats] = useState({ 'Fashion': true });
    const { location } = useLocation();
    
    const [availableTags, setAvailableTags] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(categoryName || 'Fashion');

    // Banner Slider State
    const [currentBanner, setCurrentBanner] = useState(0);
    const banners = [
        {
            title: "Fresh Seasonal Picks",
            desc: "Get up to 40% off on organic fruits sourced directly from local artisans.",
            image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800",
            bg: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
        },
        {
            title: "Summer Collection",
            desc: "Trendy fashion arrivals with exclusive member discounts up to 50%.",
            image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800",
            bg: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)"
        },
        {
            title: "Next-Gen Tech",
            desc: "Upgrade your lifestyle with the latest gadgets and electronics accessories.",
            image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
            bg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);



    const [dbCategories, setDbCategories] = useState([]);

    useEffect(() => {
        const fetchDbCategories = async () => {
            try {
                // Fetch Sections
                const { data: sectionsData, error: sectionsError } = await supabase
                    .from('category_sections')
                    .select('*')
                    .order('name');
                if (sectionsError) throw sectionsError;

                // Fetch All Subsections
                const { data: subData, error: subError } = await supabase
                    .from('category_subsections')
                    .select('*')
                    .order('name');
                if (subError) throw subError;
                
                // Group subsections under sections
                const structured = (sectionsData || []).map(section => ({
                    ...section,
                    subcategories: (subData || []).filter(sub => sub.section_id === section.id)
                }));

                setDbCategories(structured);
                if (structured.length > 0 && !categoryName) {
                    setActiveCategory(structured[0].name);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchDbCategories();
    }, []);


    // Helper to get icon component or emoji
    const getCategoryIcon = (iconNameOrUrl, size = 24, isImageUrl = false) => {
        if (isImageUrl && iconNameOrUrl) {
            return (
                <div className="cat-img-mini" style={{ width: size, height: size }}>
                    <img src={iconNameOrUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                </div>
            );
        }
        if (!iconNameOrUrl) return <Package size={size} />;
        // If it's an emoji (single character roughly) or a URL starting with http
        if (iconNameOrUrl.length < 3) return <span style={{ fontSize: `${size}px` }}>{iconNameOrUrl}</span>;
        
        // Map common lucide names if needed, or just default to Package
        const iconMap = {
            'Shirt': <Shirt size={size} />,
            'Palette': <Palette size={size} />,
            'Monitor': <Monitor size={size} />,
            'Gem': <Gem size={size} />,
            'Footprints': <Footprints size={size} />,
            'Gamepad2': <Gamepad2 size={size} />,
            'Armchair': <Armchair size={size} />,
            'ShoppingBag': <ShoppingBag size={size} />,
            'Wind': <Wind size={size} />,
            'Activity': <Activity size={size} />,
            'Package': <Package size={size} />
        };
        return iconMap[iconNameOrUrl] || <span>{iconNameOrUrl}</span>;
    };

    useEffect(() => {
        const fetchAvailableTags = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.from('products').select('tags');
                if (error) throw error;
                const tagsSet = new Set();
                data.forEach(p => {
                    if (p.tags) p.tags.forEach(t => {
                        if (t) tagsSet.add(t.toLowerCase().trim());
                    });
                });
                setAvailableTags(tagsSet);
            } catch (e) {
                console.error('Error fetching available tags:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchAvailableTags();
    }, []);

    const toggleExpand = (cat) => {
        setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    if (loading) {
        return (
            <div className="categories-page-new">
                <Navbar />
                <main className="container main-layout">
                    <LoadingSpinner fullPage />
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="categories-page-new">
            <Navbar />
            
            <div className="container main-layout">
                {/* Desktop View (Current) */}
                <div className="desktop-view-container">
                    <aside className="sidebar">
                        <div className="sidebar-section">
                            <h3 className="sidebar-title">CATEGORIES</h3>
                            <ul className="category-tree">
                                {dbCategories.map(cat => (
                                    <li key={cat.id} className="category-item">
                                        <div 
                                            className={`category-header ${activeCategory === cat.name ? 'active' : ''}`}
                                            onClick={() => {
                                                setActiveCategory(cat.name);
                                                if (cat.subcategories?.length > 0) toggleExpand(cat.name);
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {getCategoryIcon(cat.image_url || cat.icon, 18, !!cat.image_url)}
                                                <span>{cat.name}</span>
                                            </div>
                                            {cat.subcategories?.length > 0 && (
                                                expandedCats[cat.name] ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                                            )}
                                        </div>
                                        {cat.subcategories?.length > 0 && expandedCats[cat.name] && (
                                            <ul className="subcategory-list">
                                                {cat.subcategories.map(sub => {
                                                    const isAvailable = availableTags.has(sub.name.toLowerCase().trim());
                                                    return (
                                                        <li 
                                                            key={sub.id} 
                                                            className="subcategory-item"
                                                            onClick={() => navigate(`/?search=${encodeURIComponent(sub.name)}`)}
                                                            style={{ position: 'relative' }}
                                                        >
                                                            {sub.name}
                                                            {!isAvailable && <span className="availability-tag" style={{
                                                                fontSize: '10px',
                                                                color: '#ef4444',
                                                                fontWeight: 'normal',
                                                                marginLeft: '8px',
                                                                fontStyle: 'italic'
                                                            }}>(Product not available)</span>}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </aside>

                    <main className="content-main">
                        {/* Hero Banner */}
                        <section className="hero-banner-new" style={{ background: banners[currentBanner].bg }}>
                            <div className="banner-text">
                                <h2>{banners[currentBanner].title}</h2>
                                <p>{banners[currentBanner].desc}</p>
                                <button className="shop-now-btn">Shop Now</button>
                            </div>
                            <div className="banner-image-container">
                                <img src={banners[currentBanner].image} alt={banners[currentBanner].title} />
                            </div>
                        </section>

                        {/* Breadcrumbs */}
                        <nav className="breadcrumbs">
                            <Link to="/">Home</Link>
                            <ChevronRight size={14} />
                            <Link to="/categories">Categories</Link>
                            <ChevronRight size={14} />
                            <span className="current">{activeCategory}</span>
                        </nav>
                    </main>
                </div>

                {/* Mobile View (New) */}
                <div className="mobile-view-container">
                    {/* Hero Banner Slider for Mobile */}
                    <div className="mobile-banner-slider">
                        <section className="hero-banner-new mobile-banner" style={{ background: banners[currentBanner].bg }}>
                            <div className="banner-text">
                                <h2>{banners[currentBanner].title}</h2>
                                <p>{banners[currentBanner].desc}</p>
                                <button className="shop-now-btn">Shop Now</button>
                            </div>
                            <div className="banner-image-container">
                                <img src={banners[currentBanner].image} alt={banners[currentBanner].title} />
                            </div>
                        </section>
                        <div className="banner-dots">
                            {banners.map((_, i) => (
                                <div key={i} className={`dot ${currentBanner === i ? 'active' : ''}`} />
                            ))}
                        </div>
                    </div>
                    
                    <div className="mobile-category-layout">
                        {/* Mobile Sidebar */}
                        <aside className="mobile-sidebar">
                            {dbCategories.map(cat => (
                                <div 
                                    key={cat.id} 
                                    className={`mobile-nav-item ${activeCategory === cat.name ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat.name)}
                                >
                                    <div className="mobile-nav-icon">
                                        {getCategoryIcon(cat.image_url || cat.icon, 24, !!cat.image_url)}
                                    </div>
                                    <span className="mobile-nav-text">{cat.name}</span>
                                </div>
                            ))}
                        </aside>

                        {/* Mobile Content Area */}
                        <main className="mobile-content">
                             <div className="subcategory-grid">
                                {dbCategories.find(c => c.name === activeCategory)?.subcategories?.map((sub, index) => {
                                    const isAvailable = availableTags.has(sub.name.toLowerCase().trim());
                                    return (
                                        <div key={index} className="subcategory-card-wrapper" onClick={() => {
                                            navigate(`/?search=${encodeURIComponent(sub.name)}`);
                                        }}>
                                            <div className="subcategory-card" style={{ backgroundColor: '#f8fafc', opacity: isAvailable ? 1 : 0.6 }}>
                                                <div className="subcategory-icon">
                                                    {getCategoryIcon(sub.image_url || sub.icon, 48, !!sub.image_url)}
                                                </div>
                                                {!isAvailable && (
                                                    <div className="availability-overlay" style={{
                                                        position: 'absolute',
                                                        bottom: '4px',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        width: '100%',
                                                        textAlign: 'center',
                                                        fontSize: '8px',
                                                        color: '#fff',
                                                        background: 'rgba(239, 68, 68, 0.8)',
                                                        padding: '2px 0'
                                                    }}>
                                                        Not Available
                                                    </div>
                                                )}
                                            </div>
                                            <span className="subcategory-label" style={{ color: isAvailable ? 'inherit' : '#94a3b8' }}>{sub.name}</span>
                                        </div>
                                    );
                                }) || (
                                    <div className="no-subcategories">
                                        <p>No subcategories available for {activeCategory}</p>
                                    </div>
                                )}
                            </div>

                        </main>
                    </div>
                </div>
            </div>

            <Footer />

            <style>{`
                .categories-page-new {
                    background: #fff;
                    min-height: 100vh;
                }
                .main-layout {
                    padding-top: 2rem;
                    padding-bottom: 4rem;
                }

                /* SIDEBAR */
                .sidebar {
                    border-right: 1px solid #f1f5f9;
                    padding-right: 1.5rem;
                }
                .sidebar-section {
                    margin-bottom: 2.5rem;
                }
                .sidebar-title {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 1.5rem;
                    letter-spacing: 1px;
                }
                .category-tree { list-style: none; }
                .category-item { margin-bottom: 0.5rem; }
                .category-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 0;
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: #475569;
                    cursor: pointer;
                    transition: color 0.2s;
                    border-bottom: 1px solid #f8fafc;
                }
                .category-header:hover, .category-header.active { color: var(--primary); }
                .category-header.active { 
                    color: var(--primary); 
                    border-bottom-color: var(--primary); 
                    font-weight: 700;
                }
                
                .subcategory-list {
                    list-style: none;
                    padding-left: 1rem;
                    margin-top: 0.5rem;
                }
                .subcategory-item {
                    padding: 0.5rem 0;
                    font-size: 0.85rem;
                    color: #64748b;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .subcategory-item:hover, .subcategory-item.active { 
                    color: var(--primary); 
                    font-weight: 700; 
                }

                .price-filter-box, .price-slider, .price-labels, .current-price-val { display: none; }

                @media (min-width: 1025px) {
                    .mobile-view-container { display: none; }
                    .desktop-view-container {
                        display: grid;
                        grid-template-columns: 280px 1fr;
                        gap: 2rem;
                    }
                }

                @media (max-width: 1024px) {
                    .desktop-view-container { display: none; }
                    .mobile-view-container { display: block; margin-top: -1rem; }
                }

                /* MAIN CONTENT */
                .hero-banner-new {
                    height: 240px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #ffd3a5 0%, #fd6585 100%);
                    overflow: hidden;
                    display: flex;
                    margin-bottom: 1.5rem;
                    color: #1e293b;
                    position: relative;
                }
                .hero-banner-new {
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #4f46e5) 100%);
                }
                .banner-text {
                    flex: 1;
                    padding: 2.5rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 0.75rem;
                    z-index: 2;
                }
                .banner-text h2 { font-size: 2.25rem; font-weight: 800; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .banner-text p { color: #fff; font-size: 1rem; opacity: 0.95; max-width: 400px; }
                .shop-now-btn {
                    align-self: flex-start;
                    background: white;
                    color: var(--primary);
                    padding: 0.6rem 1.75rem;
                    border-radius: 4px;
                    font-weight: 800;
                    font-size: 0.85rem;
                    margin-top: 1rem;
                    transition: transform 0.2s;
                }
                .shop-now-btn:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .banner-image-container {
                    flex: 1;
                    display: flex;
                    justify-content: flex-end;
                    position: relative;
                }
                .banner-image-container img {
                    height: 100%;
                    width: 100%;
                    object-fit: cover;
                    mask-image: linear-gradient(to right, transparent, black 40%);
                }

                .breadcrumbs {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    color: #94a3b8;
                    margin-bottom: 2rem;
                }
                .breadcrumbs a:hover { color: var(--primary); }
                .breadcrumbs .current { color: #1e293b; font-weight: 600; }

                .filter-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 0;
                    border-top: 1px solid #f1f5f9;
                    border-bottom: 1px solid #f1f5f9;
                    margin-bottom: 2rem;
                }
                .filter-group { display: flex; gap: 0.75rem; align-items: center; }
                .filter-dropdown {
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #475569;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .filter-dropdown:hover { border-color: var(--primary); color: var(--primary); }
                .active-filter-tag {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #eef2ff;
                    color: var(--primary);
                    padding: 0.4rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: 1px solid #e0e7ff;
                }
                .active-filter-tag svg { cursor: pointer; }
                .sort-group { display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #64748b; font-weight: 600; }
                .sort-dropdown { background: none; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }

                .results-header h2 { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 2rem; }
                .results-header span { font-weight: 500; font-size: 0.95rem; color: #94a3b8; margin-left: 0.5rem; }

                .products-grid-new {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 4rem;
                }

                .no-results-premium, .coming-soon-container {
                    grid-column: 1 / -1;
                    padding: 6rem 2rem;
                    text-align: center;
                    color: #94a3b8;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }
                .coming-soon-container h3, .no-results-premium h3 {
                    color: #1e293b;
                    font-size: 1.5rem;
                    font-weight: 800;
                }
                .coming-soon-container svg { color: var(--primary); }

                .pagination-premium {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.5rem;
                }
                .page-nav, .page-num {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #e2e8f0;
                    background: white;
                    border-radius: 4px;
                    font-weight: 700;
                    color: #475569;
                    transition: 0.2s;
                }
                .page-num.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }
                .page-num:hover:not(.active) { background: #f1f5f9; border-color: var(--primary); color: var(--primary); }
                .page-dots { color: #94a3b8; font-weight: 800; padding: 0 0.5rem; }

                @media (min-width: 1025px) {
                    .mobile-view-container { display: none; }
                    .desktop-view-container {
                        display: grid;
                        grid-template-columns: 280px 1fr;
                        gap: 2rem;
                    }
                }

                @media (max-width: 1024px) {
                    .desktop-view-container { display: none; }
                    .mobile-view-container { display: block; margin-top: -1rem; }
                    
                    .mobile-banner {
                        height: 180px;
                        margin: 0;
                        border-radius: 0;
                    }
                    .mobile-banner-slider {
                        position: relative;
                        margin-bottom: 0.5rem;
                    }
                    .banner-dots {
                        position: absolute;
                        bottom: 12px;
                        left: 50%;
                        transform: translateX(-50%);
                        display: flex;
                        gap: 6px;
                        z-index: 10;
                    }
                    .dot {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background: rgba(255,255,255,0.4);
                        transition: all 0.3s;
                    }
                    .dot.active {
                        background: #fff;
                        width: 16px;
                        border-radius: 3px;
                    }
                    .mobile-banner .banner-text {
                        padding: 1.25rem;
                        gap: 0.35rem;
                    }
                    .mobile-banner .banner-text h2 {
                        font-size: 1.4rem;
                        line-height: 1.2;
                    }
                    .mobile-banner .banner-text p {
                        font-size: 0.75rem;
                        max-width: 180px;
                        line-height: 1.3;
                    }
                    .mobile-banner .shop-now-btn {
                        padding: 0.35rem 0.85rem;
                        font-size: 0.7rem;
                        margin-top: 0.5rem;
                    }

                    .mobile-category-layout {
                        display: flex;
                        height: calc(100vh - 70px);
                        background: #fff;
                    }

                    /* MOBILE SIDEBAR */
                    .mobile-sidebar {
                        width: 90px;
                        background: #f8fafc;
                        border-right: 1px solid #f1f5f9;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        padding-bottom: 2rem;
                    }
                    .mobile-nav-item {
                        padding: 1.25rem 0.5rem;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.5rem;
                        cursor: pointer;
                        position: relative;
                        transition: all 0.2s;
                    }
                    .mobile-nav-icon {
                        width: 44px;
                        height: 44px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #64748b;
                        background: #fff;
                        transition: all 0.2s;
                    }
                    .mobile-nav-text {
                        font-size: 0.7rem;
                        font-weight: 600;
                        color: #64748b;
                        text-align: center;
                    }
                    .mobile-nav-item.active {
                        background: #fff;
                    }
                    .mobile-nav-item.active::before {
                        content: '';
                        position: absolute;
                        left: 0;
                        top: 20%;
                        height: 60%;
                        width: 5px;
                        background: #8b5cf6;
                        border-radius: 0 4px 4px 0;
                    }
                    .mobile-nav-item.active .mobile-nav-icon {
                        background: #f5f3ff;
                        color: #8b5cf6;
                        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
                    }
                    .mobile-nav-item.active .mobile-nav-text {
                        color: #8b5cf6;
                        font-weight: 800;
                    }

                    /* MOBILE CONTENT */
                    .mobile-content {
                        flex: 1;
                        padding: 1.5rem 1rem;
                        overflow-y: auto;
                        background: #fff;
                    }
                    .subcategory-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1.5rem 1rem;
                    }
                    .subcategory-card-wrapper {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.75rem;
                    }
                    .subcategory-card {
                        width: 100%;
                        aspect-ratio: 1;
                        border-radius: 12px;
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    }
                    .subcategory-icon {
                        font-size: 2.5rem;
                    }
                    .count-badge {
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: #fff;
                        color: #64748b;
                        padding: 2px 6px;
                        border-radius: 10px;
                        font-size: 0.65rem;
                        font-weight: 700;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    }
                    .subcategory-label {
                        font-size: 0.8rem;
                        font-weight: 700;
                        color: #1e293b;
                        text-align: center;
                    }
                    
                        text-align: center;
                        color: #94a3b8;
                    }

                    .cat-img-mini {
                        overflow: hidden;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 4px;
                        background: #f1f5f9;
                    }

                    .subcategory-icon {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        border-radius: 12px;
                    }
                    .subcategory-icon img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                }
            `}</style>
        </div>
    );
};

export default Categories;
