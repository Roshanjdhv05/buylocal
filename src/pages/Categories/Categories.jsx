import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useLocation } from '../../context/LocationContext';
import {
    ShoppingBag,
    ArrowRight,
    ChevronRight,
    ChevronDown,
    ArrowLeft
} from 'lucide-react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ProductCard from '../../components/ProductCard';

const Categories = () => {
    const { t } = useTranslation();
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeSubSubName = searchParams.get('subsub') || null;

    const { location } = useLocation();
    
    const [availableTags, setAvailableTags] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(categoryName || null);

    // Banner Slider State — fetched from DB (page_location = 'category')
    const [currentBanner, setCurrentBanner] = useState(0);
    const [dbBanners, setDbBanners] = useState([]);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Fetch category-page banners from DB
    useEffect(() => {
        const fetchCategoryBanners = async () => {
            try {
                const { data, error } = await supabase
                    .from('banner_campaigns')
                    .select('*')
                    .eq('page_location', 'category')
                    .eq('is_active', true)
                    .or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`);
                if (!error && data && data.length > 0) {
                    setDbBanners(data);
                }
            } catch (e) {
                console.error('Category banners fetch error:', e);
            }
        };
        fetchCategoryBanners();
    }, []);

    // Auto-advance slider
    useEffect(() => {
        const total = dbBanners.length || 1;
        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % total);
        }, 5000);
        return () => clearInterval(timer);
    }, [dbBanners.length]);



    const [dbCategories, setDbCategories] = useState([]);
    const [activeSubsection, setActiveSubsection] = useState(null);

    const handleSubsectionChange = (sub) => {
        setActiveSubsection(sub);
        setSearchParams(params => {
            if (params.has('subsub')) {
                const newParams = new URLSearchParams(params);
                newParams.delete('subsub');
                return newParams;
            }
            return params;
        });
    };

    const handleSectionChange = (catName) => {
        setActiveCategory(catName);
        setActiveSubsection(null);
        setSearchParams(params => {
            const newParams = new URLSearchParams(params);
            newParams.delete('subsub');
            return newParams;
        });
    };

    // Curated cover images for subsections (Men, Women, Kids, etc.)
    const getSubsectionImage = (name) => {
        const lower = name.toLowerCase().trim();
        if (lower === 'men' || lower === "men's" || lower === 'mens')
            return 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&auto=format&fit=crop&q=60';
        if (lower === 'women' || lower === "women's" || lower === 'womens')
            return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=60';
        if (lower === 'kids' || lower === "kid's" || lower === 'children' || lower === 'boys' || lower === 'girls')
            return 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&auto=format&fit=crop&q=60';
        if (lower === 'footwear' || lower === 'shoes' || lower === 'sandals')
            return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60';
        if (lower === 'electronics' || lower === 'gadgets')
            return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=60';
        if (lower === 'furniture' || lower === 'home decor' || lower === 'living room')
            return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=60';
        if (lower === 'grocery' || lower === 'food' || lower === 'vegetables' || lower === 'fruits')
            return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=60';
        if (lower === 'jewellery' || lower === 'jewelry' || lower === 'accessories')
            return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=60';
        if (lower === 'toys' || lower === 'games')
            return 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&auto=format&fit=crop&q=60';
        return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=60';
    };

    const [products, setProducts] = useState([]);
    const [subSubs, setSubSubs] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

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

                if (structured.length > 0) {
                    let matchedSection = null;
                    let matchedSubsection = null;

                    if (categoryName) {
                        // Check if categoryName is a Section name
                        matchedSection = structured.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
                        
                        if (!matchedSection) {
                            // Check if categoryName is a Subsection name (e.g. Men's Wear)
                            for (const sec of structured) {
                                const sub = sec.subcategories.find(s => {
                                    const sName = s.name.toLowerCase();
                                    const cName = categoryName.toLowerCase();
                                    return sName === cName || 
                                           (cName === 'men' && sName === "men's wear") ||
                                           (cName === 'women' && sName === "women's wear") ||
                                           (cName === 'kids' && sName === "kids' wear");
                                });
                                if (sub) {
                                    matchedSection = sec;
                                    matchedSubsection = sub;
                                    break;
                                }
                            }
                        }
                    }

                    if (categoryName) {
                        const activeSec = matchedSection || structured[0];
                        setActiveCategory(activeSec.name);
                    } else {
                        setActiveCategory(null);
                    }

                    if (matchedSubsection) {
                        setActiveSubsection(matchedSubsection);
                    } else {
                        // Start at section level — show subsection boxes, don't auto-select
                        setActiveSubsection(null);
                    }
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchDbCategories();
    }, [categoryName]);

    // Fetch sub-subsections and products when active subsection changes
    useEffect(() => {
        const fetchSubsectionData = async () => {
            if (!activeSubsection) {
                setSubSubs([]);
                setProducts([]);
                return;
            }
            setLoadingProducts(true);
            try {
                // 1. Fetch sub-subsections for this subsection
                const { data: subSubsData, error: subSubsError } = await supabase
                    .from('category_sub_subsections')
                    .select('*')
                    .eq('subsection_id', activeSubsection.id)
                    .order('name');
                if (subSubsError) throw subSubsError;
                setSubSubs(subSubsData || []);

                // 2. Fetch all products (to filter in memory)
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*, stores(name, lat, lng)')
                    .order('created_at', { ascending: false });
                if (productsError) throw productsError;
                setProducts(productsData || []);
            } catch (err) {
                console.error('Error fetching subsection products:', err);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchSubsectionData();
    }, [activeSubsection]);

    // Helper to check if a product matches a sub-subsection name
    const matchesSubSub = (product, subSubName) => {
        const nameLower = (product.name || '').toLowerCase();
        const descLower = (product.description || '').toLowerCase();
        const taglineLower = (product.tagline || '').toLowerCase();
        const tagsLower = (product.tags || []).map(t => (t || '').toLowerCase());
        
        const subSubLower = subSubName.toLowerCase().trim();
        
        // Prevent 'T-Shirt' / 'tshirt' matching 'Shirt'
        if (subSubLower === 'shirt') {
            const isTShirt = nameLower.includes('t-shirt') || 
                             nameLower.includes('tshirt') || 
                             descLower.includes('t-shirt') || 
                             descLower.includes('tshirt') || 
                             taglineLower.includes('t-shirt') || 
                             taglineLower.includes('tshirt') ||
                             tagsLower.some(t => t.includes('t-shirt') || t.includes('tshirt'));
            if (isTShirt) return false;
        }
        
        if (nameLower.includes(subSubLower)) return true;
        if (descLower.includes(subSubLower)) return true;
        if (taglineLower.includes(subSubLower)) return true;
        if (tagsLower.some(t => t.includes(subSubLower))) return true;
        
        return false;
    };

    // Segregate products into sub-subsections
    const getSegregatedProducts = () => {
        if (!activeSubsection) return [];
        
        // Filter products belonging to activeSubsection (via category field or tag match)
        const subsectionProducts = products.filter(p => 
            (p.category && p.category.toLowerCase() === activeSubsection.name.toLowerCase()) ||
            (p.tags && p.tags.some(t => t && t.toLowerCase().trim() === activeSubsection.name.toLowerCase().trim()))
        );

        // Map sub-subsections to their matched products
        const groups = subSubs.map(ss => {
            const matched = subsectionProducts.filter(p => matchesSubSub(p, ss.name));
            return {
                ...ss,
                products: matched
            };
        });

        // Group remaining unmatched products under 'Others'
        const matchedProductIds = new Set();
        groups.forEach(g => g.products.forEach(p => matchedProductIds.add(p.id)));

        const others = subsectionProducts.filter(p => !matchedProductIds.has(p.id));

        if (others.length > 0) {
            groups.push({
                id: 'others',
                name: 'Others',
                products: others
            });
        }

        // Return only groups that have products
        return groups.filter(g => g.products.length > 0);
    };

    // Helper to map sub-subsections to beautiful curated cover images
    const getGroupImage = (name) => {
        const lower = name.toLowerCase().trim();
        if (lower === 'shirt' || lower === 'shirts') {
            return 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=60';
        }
        if (lower === 't-shirt' || lower === 't-shirts' || lower === 'tshirt' || lower === 'tshirts') {
            return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=60';
        }
        if (lower === 'jacket' || lower === 'jackets') {
            return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=60';
        }
        if (lower === 'footwear' || lower === 'shoes' || lower === 'shoe') {
            return 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=60';
        }
        // Elegant fallback for 'others' or custom sub-subsections
        return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=60';
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

    // Track which sidebar category is expanded (for subsection list)
    const [sidebarExpandedCat, setSidebarExpandedCat] = useState(activeCategory || null);
    // Track which subsection is expanded in sidebar for sub-subsection dropdown
    const [sidebarExpandedSub, setSidebarExpandedSub] = useState(null);

    // Keep sidebar expanded state in sync
    useEffect(() => {
        if (activeCategory) setSidebarExpandedCat(activeCategory);
    }, [activeCategory]);

    useEffect(() => {
        if (activeSubsection) setSidebarExpandedSub(activeSubsection.id);
    }, [activeSubsection]);

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

    const handleSidebarCatClick = (cat) => {
        if (sidebarExpandedCat === cat.name) {
            setSidebarExpandedCat(null);
        } else {
            setSidebarExpandedCat(cat.name);
            handleSectionChange(cat.name);
        }
    };

    const handleSidebarSubClick = (sub) => {
        if (sidebarExpandedSub === sub.id) {
            setSidebarExpandedSub(null);
        } else {
            setSidebarExpandedSub(sub.id);
            handleSubsectionChange(sub);
        }
    };

    const handleSidebarSubSubClick = (subSubName) => {
        setSearchParams(params => {
            params.set('subsub', subSubName);
            return params;
        });
    };

    return (
        <div className="categories-page-new">
            <Navbar />
            
            <div className="container main-layout">
                {/* Hero Banner */}
                {/* Hero Banner — dynamic from Admin panel */}
                {dbBanners.length > 0 ? (
                    <section className="hero-banner-new category-db-banner">
                        <img
                            src={isMobile && dbBanners[currentBanner]?.mobile_banner_url
                                ? dbBanners[currentBanner].mobile_banner_url
                                : dbBanners[currentBanner]?.banner_url}
                            alt="Category Banner"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 16 }}
                        />
                        {/* Dots indicator */}
                        {dbBanners.length > 1 && (
                            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                                {dbBanners.map((_, i) => (
                                    <span
                                        key={i}
                                        onClick={() => setCurrentBanner(i)}
                                        style={{
                                            width: i === currentBanner ? 20 : 8, height: 8,
                                            borderRadius: 4, background: i === currentBanner ? '#6366f1' : 'rgba(255,255,255,0.6)',
                                            cursor: 'pointer', transition: 'all 0.3s'
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="hero-banner-new" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                        <div className="banner-text">
                            <h2>Explore Categories</h2>
                            <p>Discover the best local products across all categories.</p>
                            <button className="shop-now-btn">Shop Now</button>
                        </div>
                        <div className="banner-image-container">
                            <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=800" alt="Categories" />
                        </div>
                    </section>
                )}

                {/* Breadcrumbs */}
                <nav className="breadcrumbs">
                    <Link to="/">Home</Link>
                    <ChevronRight size={14} />
                    <span onClick={() => { handleSectionChange(null); setSidebarExpandedCat(null); }} style={{ cursor: 'pointer', color: activeCategory ? 'var(--primary)' : 'inherit', fontWeight: activeCategory ? '600' : 'normal' }}>Categories</span>
                    
                    {activeCategory && (
                        <>
                            <ChevronRight size={14} />
                            {activeSubSubName ? (
                                <>
                                    <span onClick={() => handleSectionChange(activeCategory)} style={{ cursor: 'pointer', color: 'var(--primary)' }}>{activeCategory}</span>
                                    <ChevronRight size={14} />
                                    <span onClick={() => { setSearchParams(p => { p.delete('subsub'); return p; }); }} style={{ cursor: 'pointer', color: 'var(--primary)' }}>{activeSubsection?.name}</span>
                                    <ChevronRight size={14} />
                                    <span className="current">{activeSubSubName}</span>
                                </>
                            ) : activeSubsection ? (
                                <>
                                    <span onClick={() => handleSectionChange(activeCategory)} style={{ cursor: 'pointer', color: 'var(--primary)' }}>{activeCategory}</span>
                                    <ChevronRight size={14} />
                                    <span className="current">{activeSubsection.name}</span>
                                </>
                            ) : (
                                <span className="current">{activeCategory}</span>
                            )}
                        </>
                    )}
                </nav>

                {/* Desktop Two-Column Layout */}
                <div className="cat-page-body">

                    {/* ── SIDEBAR (desktop only) ── */}
                    <aside className="cat-sidebar">
                        <div className="cat-sidebar-inner">
                            <h3 className="cat-sidebar-title">Categories</h3>
                            <ul className="cat-sidebar-list">
                                {dbCategories.map(cat => {
                                    const isExpanded = sidebarExpandedCat === cat.name;
                                    const isActive = activeCategory === cat.name;
                                    return (
                                        <li key={cat.id} className="cat-sidebar-item">
                                            <button
                                                className={`cat-sidebar-btn${isActive ? ' active' : ''}`}
                                                onClick={() => handleSidebarCatClick(cat)}
                                            >
                                                <span>{cat.name}</span>
                                                <ChevronDown
                                                    size={15}
                                                    className={`cat-sidebar-chevron${isExpanded ? ' rotated' : ''}`}
                                                />
                                            </button>

                                            {/* Subsections list */}
                                            {isExpanded && cat.subcategories && cat.subcategories.length > 0 && (
                                                <ul className="cat-sidebar-sub-list">
                                                    {cat.subcategories.map(sub => {
                                                        const isSubActive = activeSubsection?.id === sub.id;
                                                        const isSubExpanded = sidebarExpandedSub === sub.id;
                                                        const subSubsForThis = (isSubActive && subSubs.length > 0) ? subSubs : [];
                                                        return (
                                                            <li key={sub.id} className="cat-sidebar-sub-item">
                                                                <button
                                                                    className={`cat-sidebar-sub-btn${isSubActive ? ' active' : ''}`}
                                                                    onClick={() => handleSidebarSubClick(sub)}
                                                                >
                                                                    <span>{sub.name}</span>
                                                                    {isSubActive && subSubsForThis.length > 0 && (
                                                                        <ChevronDown
                                                                            size={13}
                                                                            className={`cat-sidebar-chevron small${isSubExpanded ? ' rotated' : ''}`}
                                                                        />
                                                                    )}
                                                                </button>

                                                                {/* Sub-subsection dropdown */}
                                                                {isSubActive && isSubExpanded && subSubsForThis.length > 0 && (
                                                                    <ul className="cat-sidebar-subsub-list">
                                                                        {subSubsForThis.map(ss => (
                                                                            <li key={ss.id}>
                                                                                <button
                                                                                    className={`cat-sidebar-subsub-btn${activeSubSubName === ss.name ? ' active' : ''}`}
                                                                                    onClick={() => handleSidebarSubSubClick(ss.name)}
                                                                                >
                                                                                    {ss.name}
                                                                                </button>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </aside>

                    {/* ── MAIN CONTENT ── */}
                    <main className="content-main">
                        {loadingProducts ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                                <LoadingSpinner />
                            </div>
                        ) : !activeCategory ? (
                            // Show All Top-Level Categories Grid
                            <div className="subsection-products-view">
                                <div className="subsection-header" style={{ marginBottom: '2rem' }}>
                                    <h2 className="responsive-section-title">All Categories</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                        Explore our wide range of products
                                    </p>
                                </div>
                                <div className="subsub-boxes-grid">
                                    {dbCategories.map(cat => (
                                        <div 
                                            key={cat.id} 
                                            className="subsub-box-card"
                                            onClick={() => handleSectionChange(cat.name)}
                                        >
                                            <div className="subsub-box-img-container">
                                                <img src={cat.image_url || getGroupImage(cat.name)} alt={cat.name} className="subsub-box-img" />
                                                <div className="subsub-box-gradient" />
                                            </div>
                                            <div className="subsub-box-info">
                                                <h3 className="subsub-box-name">{cat.name}</h3>
                                                <div className="subsub-box-action">
                                                    Explore <ArrowRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : activeSubsection ? (
                            <div className="subsection-products-view">
                                {activeSubSubName ? (
                                    (() => {
                                        const matchedGroup = getSegregatedProducts().find(
                                            g => g.name.toLowerCase() === activeSubSubName.toLowerCase()
                                        );
                                        
                                        if (!matchedGroup) {
                                            return (
                                                <div className="no-results-premium" style={{ padding: '4rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <ShoppingBag size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Category not found</h3>
                                                    <p style={{ color: '#94a3b8' }}>We couldn't find any products under "{activeSubSubName}" in {activeSubsection.name}.</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="subsub-detail-view animate-fade-in">
                                                <div className="subsub-detail-header" style={{ marginBottom: '2rem' }}>
                                                    <button 
                                                        className="back-to-sub-btn" 
                                                        onClick={() => {
                                                            setSearchParams(params => {
                                                                params.delete('subsub');
                                                                return params;
                                                            });
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#64748b',
                                                            fontWeight: '700',
                                                            cursor: 'pointer',
                                                            marginBottom: '1rem',
                                                            padding: '0',
                                                            fontSize: '0.9rem',
                                                            transition: 'color 0.2s'
                                                        }}
                                                    >
                                                        <ArrowLeft size={16} /> Back to {activeSubsection.name}
                                                    </button>
                                                    <h2 className="responsive-section-title" style={{ textTransform: 'capitalize' }}>
                                                        {matchedGroup.name}
                                                    </h2>
                                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                                        Explore all local {matchedGroup.name} products available in {activeSubsection.name}
                                                    </p>
                                                </div>
                                                <div className="products-grid-new">
                                                    {matchedGroup.products.map(p => (
                                                        <ProductCard key={p.id} product={p} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <>
                                        <div className="subsection-header" style={{ marginBottom: '2rem' }}>
                                            <h2 className="responsive-section-title">{activeSubsection.name}</h2>
                                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                                Discover local products in {activeSubsection.name}
                                            </p>
                                        </div>

                                        {getSegregatedProducts().length > 0 ? (
                                            <div className="subsub-boxes-grid">
                                                {getSegregatedProducts().map(group => {
                                                    const imageUrl = group.image_url || getGroupImage(group.name);
                                                    return (
                                                        <div 
                                                            key={group.id} 
                                                            className="subsub-box-card"
                                                            onClick={() => {
                                                                setSearchParams(params => {
                                                                    params.set('subsub', group.name);
                                                                    return params;
                                                                });
                                                            }}
                                                        >
                                                            <div className="subsub-box-img-container">
                                                                <img src={imageUrl} alt={group.name} className="subsub-box-img" />
                                                                <div className="subsub-box-gradient" />
                                                            </div>
                                                            <div className="subsub-box-info">
                                                                <h3 className="subsub-box-name">{group.name}</h3>
                                                                <span className="subsub-box-count">{group.products.length} Products</span>
                                                                <div className="subsub-box-action">
                                                                    Explore Collection <ArrowRight size={14} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="no-results-premium" style={{ padding: '4rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <ShoppingBag size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>No products found</h3>
                                                <p style={{ color: '#94a3b8' }}>We couldn't find any products in {activeSubsection.name} right now.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            // Show Subsection Selection Grid when no subsection is selected
                            <div className="subsection-products-view">
                                <div className="subsection-header" style={{ marginBottom: '2rem' }}>
                                    <h2 className="responsive-section-title">{activeCategory} Collections</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                        Select a category to explore {activeCategory.toLowerCase()} products
                                    </p>
                                </div>
                                <div className="subsub-boxes-grid">
                                    {dbCategories.find(c => c.name === activeCategory)?.subcategories?.map(sub => (
                                        <div 
                                            key={sub.id} 
                                            className="subsub-box-card"
                                            onClick={() => handleSubsectionChange(sub)}
                                        >
                                            <div className="subsub-box-img-container">
                                                <img src={sub.image_url || getSubsectionImage(sub.name)} alt={sub.name} className="subsub-box-img" />
                                                <div className="subsub-box-gradient" />
                                            </div>
                                            <div className="subsub-box-info">
                                                <h3 className="subsub-box-name">{sub.name}</h3>
                                                {!availableTags.has(sub.name.toLowerCase().trim()) && (
                                                    <span className="subsub-box-unavailable">
                                                        (Product not available)
                                                    </span>
                                                )}
                                                <div className="subsub-box-action">
                                                    View Items <ArrowRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <Footer />

            <style>{`
                .categories-page-new {
                    background: #fff;
                    min-height: 100vh;
                    overflow-x: hidden;
                }
                .main-layout {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 2rem 1.5rem 4rem;
                }
                .responsive-section-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0;
                }

                /* ── TWO-COLUMN BODY ── */
                .cat-page-body {
                    display: flex;
                    gap: 2rem;
                    align-items: flex-start;
                }

                /* ── SIDEBAR ── */
                .cat-sidebar {
                    width: 240px;
                    flex-shrink: 0;
                    display: block;
                }
                .cat-sidebar-inner {
                    position: sticky;
                    top: 80px;
                    background: #fff;
                    border: 1px solid #e8ecf0;
                    border-radius: 14px;
                    padding: 1.25rem 0;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.05);
                    max-height: calc(100vh - 100px);
                    overflow-y: auto;
                }
                .cat-sidebar-inner::-webkit-scrollbar { width: 4px; }
                .cat-sidebar-inner::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
                .cat-sidebar-title {
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #94a3b8;
                    padding: 0 1.25rem 0.75rem;
                    margin: 0;
                    border-bottom: 1px solid #f1f5f9;
                }
                .cat-sidebar-list {
                    list-style: none;
                    margin: 0.5rem 0 0;
                    padding: 0;
                }
                .cat-sidebar-item {
                    margin: 0;
                }
                .cat-sidebar-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.6rem 1.25rem;
                    background: none;
                    border: none;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #374151;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.18s;
                    border-left: 3px solid transparent;
                }
                .cat-sidebar-btn:hover {
                    background: #f8fafc;
                    color: var(--primary);
                }
                .cat-sidebar-btn.active {
                    color: var(--primary);
                    background: #eef2ff;
                    border-left-color: var(--primary);
                    font-weight: 700;
                }
                .cat-sidebar-chevron {
                    transition: transform 0.25s ease;
                    flex-shrink: 0;
                    color: #94a3b8;
                }
                .cat-sidebar-chevron.rotated {
                    transform: rotate(180deg);
                }

                /* Subsections list */
                .cat-sidebar-sub-list {
                    list-style: none;
                    margin: 0;
                    padding: 0 0 0.25rem;
                    background: #f8fafc;
                    border-top: 1px solid #f1f5f9;
                    border-bottom: 1px solid #f1f5f9;
                    animation: slideDown 0.2s ease-out;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .cat-sidebar-sub-item {
                    margin: 0;
                }
                .cat-sidebar-sub-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.5rem 1.25rem 0.5rem 2rem;
                    background: none;
                    border: none;
                    font-size: 0.83rem;
                    font-weight: 500;
                    color: #4b5563;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.18s;
                    border-left: 3px solid transparent;
                }
                .cat-sidebar-sub-btn:hover {
                    color: var(--primary);
                    background: #eef2ff;
                }
                .cat-sidebar-sub-btn.active {
                    color: var(--primary);
                    font-weight: 700;
                    border-left-color: var(--primary);
                    background: #e0e7ff;
                }
                .cat-sidebar-chevron.small {
                    color: #94a3b8;
                }

                /* Sub-sub dropdown */
                .cat-sidebar-subsub-list {
                    list-style: none;
                    margin: 0;
                    padding: 0 0 0.25rem;
                    background: #f1f5f9;
                    animation: slideDown 0.2s ease-out;
                }
                .cat-sidebar-subsub-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    padding: 0.4rem 1.25rem 0.4rem 2.75rem;
                    background: none;
                    border: none;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #6b7280;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.18s;
                    border-left: 3px solid transparent;
                }
                .cat-sidebar-subsub-btn::before {
                    content: '·';
                    margin-right: 0.4rem;
                    color: #94a3b8;
                }
                .cat-sidebar-subsub-btn:hover {
                    color: var(--primary);
                    background: #e0e7ff;
                }
                .cat-sidebar-subsub-btn.active {
                    color: var(--primary);
                    font-weight: 700;
                    border-left-color: var(--primary);
                    background: #dde4ff;
                }

                /* Main content takes remaining space */
                .content-main {
                    flex: 1;
                    min-width: 0;
                }

                @media (max-width: 768px) {
                    .main-layout {
                        padding: 0.75rem 0.75rem 4rem;
                    }
                    .cat-page-body {
                        flex-direction: column;
                    }
                    .cat-sidebar {
                        display: none;
                    }
                    .responsive-section-title {
                        font-size: 1.4rem;
                    }
                    .hero-banner-new {
                        height: 150px;
                        border-radius: 10px;
                        margin-bottom: 1rem;
                    }
                    .banner-text {
                        padding: 1.25rem;
                        flex: 1.5;
                    }
                    .banner-text h2 {
                        font-size: 1.35rem;
                    }
                    .banner-text p {
                        font-size: 0.8rem;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        line-height: 1.3;
                    }
                    .shop-now-btn {
                        margin-top: 0.5rem;
                        padding: 0.4rem 1rem;
                        font-size: 0.75rem;
                    }
                    .banner-image-container {
                        flex: 1;
                    }
                    .breadcrumbs {
                        margin-bottom: 1rem !important;
                        gap: 0.25rem !important;
                    }
                    .products-grid-new {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 1.0rem !important;
                    }
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
                    flex-wrap: wrap;
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


                /* Premium Subsub Category Boxes */
                .subsub-boxes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                    margin-bottom: 3rem;
                }

                .subsub-box-card {
                    position: relative;
                    border-radius: 16px;
                    height: 200px;
                    overflow: hidden;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }

                .subsub-box-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
                }

                .subsub-box-img-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                .subsub-box-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
                }

                .subsub-box-card:hover .subsub-box-img {
                    transform: scale(1.08);
                }

                .subsub-box-gradient {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 60%, rgba(15, 23, 42, 0.1) 100%);
                    transition: background 0.3s;
                }

                .subsub-box-card:hover .subsub-box-gradient {
                    background: linear-gradient(to top, rgba(99, 102, 241, 0.95) 0%, rgba(15, 23, 42, 0.5) 60%, rgba(15, 23, 42, 0.2) 100%);
                }

                .subsub-box-info {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    padding: 1.5rem;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    z-index: 2;
                }

                .subsub-box-name {
                    font-size: 1.35rem;
                    font-weight: 800;
                    text-transform: capitalize;
                    margin: 0;
                    letter-spacing: -0.5px;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    text-align: left;
                }

                .subsub-box-count {
                    font-size: 0.85rem;
                    font-weight: 600;
                    opacity: 0.85;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    text-align: left;
                }

                .subsub-box-unavailable {
                    font-size: 11px;
                    color: #ef4444;
                    font-style: italic;
                    display: block;
                    margin-top: 4px;
                    text-align: left;
                }

                .subsub-box-action {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.8rem;
                    font-weight: 700;
                    margin-top: 0.5rem;
                    color: #e0e7ff;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
                }

                .subsub-box-card:hover .subsub-box-action {
                    opacity: 1;
                    transform: translateY(0);
                    color: #ffffff;
                }

                .back-to-sub-btn:hover {
                    color: var(--primary) !important;
                }

                @media (max-width: 768px) {
                    .subsub-boxes-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 1.0rem 0.5rem !important;
                        margin-top: 0.5rem;
                        margin-bottom: 2rem;
                    }
                    .subsub-box-card {
                        height: auto !important;
                        aspect-ratio: auto !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        background: none !important;
                    }
                    .subsub-box-img-container {
                        width: 100%;
                        height: auto !important;
                        aspect-ratio: 1 / 1 !important;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    }
                    .subsub-box-gradient {
                        background: none !important;
                    }
                    .subsub-box-card:hover .subsub-box-gradient {
                        background: none !important;
                    }
                    .subsub-box-info {
                        position: relative !important;
                        bottom: auto !important;
                        left: auto !important;
                        width: 100% !important;
                        padding: 0.5rem 0.1rem 0 0.1rem !important;
                        background: none !important;
                        backdrop-filter: none !important;
                        -webkit-backdrop-filter: none !important;
                        border: none !important;
                        color: #1e293b !important;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        gap: 2px;
                        z-index: 2;
                    }
                    .subsub-box-name {
                        font-size: 0.8rem !important;
                        font-weight: 700 !important;
                        color: #1e293b !important;
                        text-shadow: none !important;
                        text-align: center !important;
                    }
                    .subsub-box-count {
                        font-size: 0.7rem !important;
                        font-weight: 600 !important;
                        color: #64748b !important;
                        text-shadow: none !important;
                        opacity: 1 !important;
                        text-align: center !important;
                    }
                    .subsub-box-unavailable {
                        font-size: 9px !important;
                        text-align: center !important;
                        margin-top: 2px !important;
                    }
                    .subsub-box-action {
                        display: none !important;
                    }
                }

                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default Categories;
