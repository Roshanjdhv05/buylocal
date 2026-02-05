import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
    Menu, X, ShoppingCart, User, Home,
    Layers, Package, LogOut, Store
} from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, profile, signOut } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
        setIsOpen(false);
    };

    const navLinks = [
        { name: 'Home', path: '/', icon: <Home size={20} /> },
        { name: 'Stores', path: '/stores', icon: <Store size={20} /> },
        { name: 'Categories', path: '/categories', icon: <Layers size={20} /> },
    ];

    const authLinks = user ? [
        { name: 'Orders', path: '/orders', icon: <Package size={20} /> },
        { name: 'Following', path: '/followed-stores', icon: <Store size={20} /> },
        { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    ] : [
        { name: 'Login', path: '/login', icon: <User size={20} /> },
        { name: 'Sign Up', path: '/signup', icon: <User size={20} /> },
    ];

    return (
        <>
            <nav className="navbar">
                <div className="container nav-content">
                    <div className="nav-left">
                        <button className="menu-btn" onClick={toggleMenu}>
                            <Menu size={24} />
                        </button>
                        <Link to="/" className="logo">Buy<span>Local</span></Link>
                    </div>

                    <div className="nav-center desktop-only">
                        {navLinks.map(link => (
                            <Link key={link.path} to={link.path}>{link.name}</Link>
                        ))}
                    </div>

                    <div className="nav-right">
                        {user ? (
                            <>
                                {profile?.role === 'seller' ? (
                                    <Link to="/seller/dashboard" className="nav-link-desktop desktop-only">Dashboard</Link>
                                ) : (
                                    <Link to="/seller/signup" className="nav-link-desktop desktop-only">Become Seller</Link>
                                )}
                                <Link to="/orders" className="nav-link-desktop desktop-only">Orders</Link>
                                <Link to="/followed-stores" className="nav-link-desktop desktop-only">Following</Link>
                                <button onClick={handleLogout} className="logout-btn-desktop desktop-only">
                                    <LogOut size={18} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link-desktop desktop-only">Login</Link>
                                <Link to="/signup" className="btn-primary desktop-only" style={{ padding: '0.5rem 1rem' }}>Sign Up</Link>
                            </>
                        )}

                        <Link to="/cart" className="cart-btn">
                            <ShoppingCart size={22} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <div className={`nav-drawer ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <Link to="/" onClick={toggleMenu} className="logo">Buy<span>Local</span></Link>
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
            </div>

            {isOpen && <div className="drawer-overlay" onClick={toggleMenu}></div>}

            <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--glass);
          backdrop-filter: var(--glass-blur);
          border-bottom: 1px solid var(--border);
          height: 70px;
          display: flex;
          align-items: center;
        }
        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .nav-left { display: flex; align-items: center; gap: 1rem; }
        .logo { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
        .logo span { color: var(--primary); }
        
        .nav-center { display: flex; gap: 2rem; }
        .nav-center a { font-weight: 500; color: var(--text-muted); transition: var(--transition); }
        .nav-center a:hover { color: var(--primary); }

        .nav-right { display: flex; align-items: center; gap: 1.5rem; }
        .cart-btn { position: relative; color: var(--text-main); }
        .cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--secondary);
          color: white;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 700;
        }

        .seller-btn {
          background: var(--grad-main);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-link-desktop {
          color: var(--text-muted);
          font-weight: 500;
          transition: var(--transition);
        }
        .nav-link-desktop:hover { color: var(--primary); }

        .logout-btn-desktop {
          background: none;
          color: var(--error);
          font-weight: 600;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem;
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

        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .menu-btn { display: block; }
        }
      `}</style>
        </>
    );
};

export default Navbar;
