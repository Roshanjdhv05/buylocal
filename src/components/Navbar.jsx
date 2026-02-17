import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
    Menu, X, ShoppingCart, User, Home,
    Layers, Package, LogOut, Store, Globe, Heart, LayoutDashboard, Search as SearchIcon, MapPin
} from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, profile, signOut, upgradeToSeller } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const [upgrading, setUpgrading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [cityName, setCityName] = useState(null);

    useEffect(() => {
        const updateCity = () => {
            const savedLoc = localStorage.getItem('saved_location');
            if (savedLoc) {
                try {
                    const parsed = JSON.parse(savedLoc);
                    if (parsed.cityName) setCityName(parsed.cityName);
                } catch (e) {
                    console.warn('Failed to parse saved location', e);
                }
            }
        };

        updateCity();
        // Add listener for storage changes (for sync across tabs)
        window.addEventListener('storage', updateCity);
        // Also poll briefly or use a custom event if navigating internally
        const interval = setInterval(updateCity, 2000);

        return () => {
            window.removeEventListener('storage', updateCity);
            clearInterval(interval);
        };
    }, []);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocating(false);
                const { latitude, longitude } = position.coords;
                // Navigate to home with location params
                navigate(`/?lat=${latitude}&lng=${longitude}`);
                setIsOpen(false);
            },
            (error) => {
                setLocating(false);
                if (error.code === 3) {
                    console.warn('Geolocation timeout, trying again or checking cached position...');
                }
                alert('Unable to retrieve your location: ' + error.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
        setIsOpen(false);
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
        { name: 'Home', path: '/', icon: <Home size={20} /> },
        { name: 'Stores', path: '/stores', icon: <Store size={20} /> },
        ...(user ? [{ name: 'Followed', path: '/followed-stores', icon: <Heart size={20} /> }] : []),
        { name: 'Categories', path: '/categories', icon: <Layers size={20} /> },
    ];

    const authLinks = user ? [
        { name: 'Wishlist', path: '/wishlist', icon: <Heart size={20} /> },
        { name: 'Orders', path: '/orders', icon: <Package size={20} /> },
        { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    ] : [
        { name: 'Login', path: '/login', icon: <User size={20} /> },
        { name: 'Sign Up', path: '/signup', icon: <User size={20} /> },
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
            <nav className="navbar">
                <div className="container nav-content">
                    <div className="nav-left">
                        <button className="menu-btn" onClick={toggleMenu}>
                            <Menu size={24} />
                        </button>
                        <Link to="/" className="logo">
                            <img src="/logo.png" alt="ByLocal" className="logo-img" />
                        </Link>
                    </div>

                    <div className="nav-center">
                        <div className="search-pill">
                            <input
                                type="text"
                                placeholder="Search for local products, brands, or shops..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                    </div>

                    <div className="nav-right">
                        <button
                            className={`location-pill desktop-only ${locating ? 'locating' : ''}`}
                            onClick={handleDetectLocation}
                            disabled={locating}
                            title={cityName ? `Location: ${cityName}` : 'Detect Location'}
                        >
                            <MapPin size={16} />
                            <span>{locating ? 'Locating...' : (cityName ? `Near ${cityName}` : 'Near Me')}</span>
                        </button>

                        <div className="nav-links desktop-only">
                            {navLinks.map(link => (
                                <Link key={link.path} to={link.path}>{link.name}</Link>
                            ))}
                        </div>

                        <div className="nav-separater desktop-only"></div>

                        <div className="nav-actions">
                            {user && profile?.role === 'seller' && (
                                <Link to="/seller/dashboard" className="dashboard-pill desktop-only">
                                    <LayoutDashboard size={16} /> Dashboard
                                </Link>
                            )}

                            {user && profile?.role === 'buyer' && (
                                <button
                                    onClick={handleBecomeSeller}
                                    className="seller-promo-pill desktop-only"
                                    disabled={upgrading}
                                >
                                    {upgrading ? '...' : 'Become Seller'}
                                </button>
                            )}

                            <button className="icon-btn desktop-only"><Globe size={20} /></button>

                            {/* Mobile Location Icon */}
                            <button
                                className={`icon-btn mobile-only ${locating ? 'locating' : ''}`}
                                onClick={handleDetectLocation}
                                disabled={locating}
                            >
                                <MapPin size={22} color={locating ? 'var(--primary)' : 'currentColor'} />
                            </button>

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
                                <div className="user-menu">
                                    <Link to="/profile" className="icon-btn"><User size={20} /></Link>
                                </div>
                            ) : (
                                <Link to="/login" className="login-link">Login</Link>
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

                    {profile && (
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
        }

        .location-pill {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #f1f5f9;
            color: #1e293b;
            padding: 0.6rem 1rem;
            border-radius: 100px;
            font-size: 0.9rem;
            font-weight: 700;
            border: 1px solid #e2e8f0;
            transition: all 0.2s;
            margin-right: 0.5rem;
        }

        .location-pill:hover {
            background: #e2e8f0;
            border-color: #cbd5e1;
            transform: translateY(-1px);
        }

        .location-pill.locating {
            animation: pulse-location 1.5s infinite;
            opacity: 0.8;
        }

        @keyframes pulse-location {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); opacity: 1; }
            100% { transform: scale(1); }
        }

        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          gap: 2rem;
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
        .mobile-only { display: none; }

        @media (max-width: 900px) {
            .mobile-only { display: flex; }
        }
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
        .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
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
            height: 60px;
            padding: 0 16px;
            background: #fff;
            border-bottom: 1px solid #eee;
          }
          .nav-content {
            gap: 1rem;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .nav-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .desktop-only { display: none; }
          .mobile-only { display: flex; }
          .mobile-search-btn { display: flex; }
          .menu-btn { display: flex; align-items: center; padding: 0; margin: 0; }
          .nav-center { display: none; } 
          .nav-right { gap: 0.75rem; display: flex; align-items: center; }
          .nav-actions { gap: 1rem; display: flex; align-items: center; }
          .logo-img {
            height: 36px !important;
            width: auto;
            object-fit: contain;
          }
        }
      `}</style>
        </>
    );
};

export default Navbar;
