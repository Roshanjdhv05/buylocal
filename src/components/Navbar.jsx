import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useTranslation } from 'react-i18next';
import {
    Menu, X, ShoppingCart, User, Home, MapPin,
    Layers, Package, LogOut, Store, Globe, Heart, LayoutDashboard, Search as SearchIcon, ChevronDown
} from 'lucide-react';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const { user, profile, signOut, upgradeToSeller } = useAuth();
    const { cartCount } = useCart();
    const { location, loading: locLoading, detectLocation } = useLocation();
    const navigate = useNavigate();
    const [upgrading, setUpgrading] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [showLangMenu, setShowLangMenu] = useState(false);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setShowLangMenu(false);
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'हिंदी' },
        { code: 'mr', name: 'मराठी' }
    ];

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setVisible(false);
            } else {
                setVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleLogout = async () => {
        try {
            await signOut();
        } finally {
            navigate('/login');
            setIsOpen(false);
        }
    };

    const handleBecomeSeller = async () => {
        if (!user) return;
        setUpgrading(true);
        try {
            await upgradeToSeller();
            alert('Welcome to the seller community! Let\'s create your store.');
            navigate('/seller/create-store');
        } catch (error) {
            alert('Failed to upgrade account: ' + error.message);
        } finally {
            setUpgrading(false);
        }
    };

    const navLinks = [
        { name: t('nav.home'), path: '/', icon: <Home size={20} /> },
        { name: t('nav.stores'), path: '/stores', icon: <Store size={20} /> },
        ...(user ? [{ name: t('nav.followed'), path: '/followed-stores', icon: <Heart size={20} /> }] : []),
        { name: t('nav.categories'), path: '/categories', icon: <Layers size={20} /> },
    ];

    const authLinks = user ? [
        { name: t('nav.wishlist'), path: '/wishlist', icon: <Heart size={20} /> },
        { name: t('nav.orders'), path: '/orders', icon: <Package size={20} /> },
        { name: t('nav.profile'), path: '/profile', icon: <User size={20} /> },
    ] : [
        { name: t('nav.login'), path: '/login', icon: <User size={20} /> },
        { name: t('nav.signUp'), path: '/signup', icon: <User size={20} /> },
    ];

    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            if (searchTerm.trim()) {
                navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
                setIsOpen(false); // Close mobile menu if open
            }
        }
    };

    return (
        <>
            <nav className={`navbar ${!visible ? 'navbar-hidden' : ''}`}>
                <div className="container nav-content">
                    <div className="nav-left">
                        <button className="menu-btn" onClick={toggleMenu}>
                            <Menu size={24} />
                        </button>
                        <div className="nav-brand-group">
                            <Link to="/" className="logo">
                                <img src="/logo.png" alt="ByLocal" className="logo-img" />
                            </Link>
                        </div>
                    </div>

                    <div className="nav-center">
                        <div className="search-pill">
                            <input
                                type="text"
                                placeholder={t('nav.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                    </div>

                    <div className="nav-right">
                        <div className="nav-links desktop-only">
                            {navLinks.map(link => (
                                <Link key={link.path} to={link.path}>{link.name}</Link>
                            ))}
                        </div>

                        <div className="nav-separater desktop-only"></div>

                        <div className="nav-actions">
                            {user && profile?.role === 'seller' && (
                                <Link to="/seller/dashboard" className="dashboard-pill desktop-only">
                                    <LayoutDashboard size={16} /> {t('nav.dashboard')}
                                </Link>
                            )}

                            {user && profile?.role === 'buyer' && (
                                <button
                                    onClick={handleBecomeSeller}
                                    className="seller-promo-pill desktop-only"
                                    disabled={upgrading}
                                >
                                    {upgrading ? '...' : t('nav.becomeSeller')}
                                </button>
                            )}

                            <div className="lang-switcher-container desktop-only">
                                <button className="icon-btn" onClick={() => setShowLangMenu(!showLangMenu)}>
                                    <Globe size={20} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', marginLeft: '2px', textTransform: 'uppercase' }}>{i18n.language.split('-')[0]}</span>
                                    <ChevronDown size={14} />
                                </button>
                                {showLangMenu && (
                                    <div className="lang-dropdown glass-card">
                                        {languages.map(lang => (
                                            <button 
                                                key={lang.code}
                                                className={`lang-option ${i18n.language === lang.code ? 'active' : ''}`}
                                                onClick={() => changeLanguage(lang.code)}
                                            >
                                                {lang.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Search Icon */}
                            <Link to="/search" className="icon-btn mobile-search-btn">
                                <SearchIcon size={22} />
                            </Link>

                            <Link to="/wishlist" className="icon-btn desktop-only"><Heart size={20} /></Link>

                            <Link to="/cart" className="icon-btn cart-btn">
                                <ShoppingCart size={20} />
                                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </Link>

                            {user ? (
                                <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Link to="/profile" className="icon-btn"><User size={20} /></Link>
                                    <button onClick={handleLogout} className="icon-btn logout-desktop" title={t('common.logout')}>
                                        <LogOut size={20} color="#ef4444" />
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="login-link">{t('nav.login')}</Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <div className={`nav-drawer ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <Link to="/" onClick={toggleMenu} className="logo">
                        <img src="/logo.png" alt="ByLocal" className="logo-img" />
                    </Link>
                    <button onClick={toggleMenu}><X size={24} /></button>
                </div>

                <div className="drawer-body">

                    <div className="drawer-section">
                        <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Globe size={16} /> {t('common.language')}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            border: '1px solid var(--border)',
                                            background: i18n.language === lang.code ? 'var(--primary)' : 'white',
                                            color: i18n.language === lang.code ? 'white' : 'var(--text-main)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {navLinks.map(link => (
                            <Link key={link.path} to={link.path} onClick={toggleMenu}>
                                {link.icon} {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="drawer-section">
                        {user && profile?.role === 'seller' && (
                            <Link to="/seller/dashboard" onClick={toggleMenu} style={{ color: 'var(--primary)', fontWeight: '700' }}>
                                <LayoutDashboard size={20} /> Seller Dashboard
                            </Link>
                        )}
                        {user && profile?.role === 'buyer' && (
                            <button
                                onClick={handleBecomeSeller}
                                className="seller-promo-pill"
                                style={{ width: '100%', marginBottom: '0.5rem' }}
                                disabled={upgrading}
                            >
                                {upgrading ? 'Upgrading...' : 'Become Seller'}
                            </button>
                        )}
                        {authLinks.map(link => (
                            <Link key={link.path} to={link.path} onClick={toggleMenu}>
                                {link.icon} {link.name}
                            </Link>
                        ))}
                    </div>

                    {user && (
                        <div className="drawer-footer">
                            <button className="logout-btn" onClick={handleLogout}>
                                <LogOut size={20} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div >

            {isOpen && <div className="drawer-overlay" onClick={toggleMenu}></div>}

            <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: white;
          border-bottom: 1px solid var(--border);
          height: 80px;
          display: flex;
          align-items: center;
          transition: transform 0.3s ease-in-out;
        }
        .navbar-hidden {
            transform: translateY(-100%);
        }
        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          gap: 2rem;
        }
        .nav-brand-group {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }
        .logo {
            flex: none;
            display: flex;
            align-items: center;
        }
        .logo-img {
            height: 45px;
            width: auto;
            display: block;
            object-fit: contain;
        }
        
        
        .nav-center { flex: 1; display: flex; justify-content: flex-start; max-width: 600px; }
        .search-pill {
            display: flex;
            align-items: center;
            background: var(--background);
            padding: 0.6rem 1rem;
            border-radius: 100px;
            width: 100%;
            gap: 0.75rem;
            transition: var(--transition);
        }
        .search-pill:focus-within {
            background: white;
            box-shadow: 0 0 0 2px var(--primary);
        }
        .search-pill input {
            border: none;
            background: transparent;
            padding: 0;
            width: 100%;
            font-size: 0.95rem;
            outline: none;
        }
        .search-icon { opacity: 0.5; font-style: normal; }

        .nav-right { display: flex; align-items: center; gap: 1.5rem; }
        .nav-links { display: flex; gap: 1.5rem; }
        .nav-links a { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
        .nav-links a:hover { color: var(--primary); }

        .nav-separater { width: 1px; height: 24px; background: var(--border); }

        .nav-actions { display: flex; align-items: center; gap: 1rem; }
        .icon-btn {
            background: none;
            color: var(--text-main);
            position: relative;
            display: flex;
            align-items: center;
            transition: var(--transition);
        }
        .icon-btn:hover { color: var(--primary); transform: translateY(-1px); }
        
        .cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444; /* Red badge */
          color: white;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 700;
        }
        
        .login-link { font-weight: 600; font-size: 0.9rem; }

        .dashboard-pill {
            background: #f1f5f9;
            color: #1e293b;
            padding: 0.4rem 0.8rem;
            border-radius: 100px;
            font-size: 0.85rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: var(--transition);
            border: 1px solid #e2e8f0;
        }
        .dashboard-pill:hover {
            background: #e2e8f0;
            border-color: #cbd5e1;
        }

        .mobile-search-btn { display: none; }

        .seller-promo-pill {
            background: var(--grad-main);
            color: white;
            padding: 0.4rem 0.9rem;
            border-radius: 100px;
            font-size: 0.85rem;
            font-weight: 700;
            transition: var(--transition);
        }
        .seller-promo-pill:hover {
            transform: translateY(-1px);
            box-shadow: var(--shadow-sm);
        }

        .menu-btn { background: none; color: var(--text-main); display: none; }

        /* Drawer */
        .nav-drawer {
          position: fixed;
          top: 0;
          left: -300px;
          width: 300px;
          height: 100vh;
          background: white;
          z-index: 1001;
          transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 2rem;
          display: flex;
          flex-direction: column;
        }
        .nav-drawer.open { left: 0; }
        .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .drawer-header .logo-img { height: 55px !important; }
        .drawer-body { display: flex; flex-direction: column; gap: 2rem; flex: 1; }
        .drawer-section { display: flex; flex-direction: column; gap: 1.25rem; }
        .drawer-section a { display: flex; align-items: center; gap: 1rem; font-size: 1.125rem; font-weight: 500; color: var(--text-main); }
        
        .drawer-footer { margin-top: auto; padding-top: 2rem; border-top: 1px solid var(--border); }
        .logout-btn { display: flex; align-items: center; gap: 1rem; color: var(--error); font-weight: 600; width: 100%; text-align: left; background: none; }

        .drawer-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.4);
          z-index: 1000;
        }


        @media (max-width: 900px) {
          .navbar {
            height: 70px;
            padding: 0 8px;
            background: #fff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          .nav-content {
            gap: 0.4rem;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .nav-left {
            display: flex;
            align-items: center;
            gap: 4px;
            overflow: visible;
            flex: none;
          }
          .nav-brand-group {
            flex-direction: column;
            align-items: center;
            gap: 2px;
            margin-top: 14px;
          }
          .desktop-only { display: none; }
          .mobile-search-btn { display: flex; padding: 0.4rem; }
          .menu-btn { display: flex; align-items: center; padding: 0.4rem; margin: 0; }
          .nav-center { display: none; } 
          .nav-right { gap: 0.25rem; display: flex; align-items: center; flex: 1; justify-content: flex-end; }
          .nav-actions { gap: 0.4rem; display: flex; align-items: center; }
          .logo-img {
            height: 42px !important;
            width: auto;
            object-fit: contain;
            margin: 0 4px;
          }
          .cart-btn { padding: 0.4rem; }
          .login-link { font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-left: 4px; }
          .user-menu { display: flex !important; gap: 0.3rem !important; }
          .logout-desktop { margin-left: 0; }
        }

        .logout-desktop {
            margin-left: 0.5rem;
            color: #64748b;
        }
        .logout-desktop:hover {
            color: #ef4444 !important;
        }

        .lang-switcher-container {
            position: relative;
        }
        .lang-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.5rem;
            min-width: 120px;
            background: white;
            padding: 0.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            z-index: 1002;
            border: 1px solid var(--border);
        }
        .lang-option {
            padding: 0.5rem 1rem;
            border-radius: 6px;
            text-align: left;
            font-size: 0.85rem;
            font-weight: 500;
            transition: var(--transition);
        }
        .lang-option:hover {
            background: var(--background);
            color: var(--primary);
        }
        .lang-option.active {
            background: var(--primary);
            color: white;
        }
      `}</style>
        </>
    );
};

export default Navbar;
