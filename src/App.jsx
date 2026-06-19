import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Pages - Lazy Loaded
const Login = lazy(() => import('./pages/Auth/Login.jsx'));
const Signup = lazy(() => import('./pages/Auth/Signup.jsx'));
const Home = lazy(() => import('./pages/Home/Home.jsx'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword.jsx'));
const UpdatePassword = lazy(() => import('./pages/Auth/UpdatePassword.jsx'));
const Categories = lazy(() => import('./pages/Categories/Categories.jsx'));
const Cart = lazy(() => import('./pages/Cart/Cart.jsx'));
const Orders = lazy(() => import('./pages/Orders/Orders.jsx'));
const CreateStore = lazy(() => import('./pages/Seller/CreateStore.jsx'));
const Search = lazy(() => import('./pages/Search/Search.jsx'));
const SellerDashboard = lazy(() => import('./pages/Seller/Dashboard.jsx'));
const Stores = lazy(() => import('./pages/Stores/Stores.jsx'));
const PublicStore = lazy(() => import('./pages/Stores/PublicStore.jsx'));
const TrendingProducts = lazy(() => import('./pages/Products/TrendingProducts.jsx'));
const StoreSection = lazy(() => import('./pages/Stores/StoreSection.jsx'));
const StoreCategoryView = lazy(() => import('./pages/Stores/StoreCategoryView.jsx'));
const ProductDetails = lazy(() => import('./pages/Product/ProductDetails.jsx'));
const FollowedStores = lazy(() => import('./pages/Stores/FollowedStores.jsx'));
const Profile = lazy(() => import('./pages/Profile/Profile.jsx'));
const Wishlist = lazy(() => import('./pages/Wishlist/Wishlist.jsx'));
const OrderDetails = lazy(() => import('./pages/Orders/OrderDetails.jsx'));
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard.jsx'));
const Subscription = lazy(() => import('./pages/Seller/Subscription.jsx'));

// Components
import LocationOnboarding from './components/LocationOnboarding';
import Toast from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import PageTransitionLoader from './components/PageTransitionLoader';

// Legal Pages - Lazy Loaded
const Terms = lazy(() => import('./pages/Legal/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Legal/Privacy.jsx'));
const Refunds = lazy(() => import('./pages/Legal/Refunds.jsx'));
const AboutUs = lazy(() => import('./pages/About/AboutUs.jsx'));
const HelpSupport = lazy(() => import('./pages/Support/HelpSupport.jsx'));
// Fallback Page
const NotFound = lazy(() => import('./components/NotFound.jsx'));

const ProtectedRoute = ({ children, role }) => {
    const { user, profile, loading } = useAuth();

    if (loading) return <LoadingSpinner fullPage />;
    if (!user) return <Navigate to="/login" />;
    if (role && profile?.role !== role) return <Navigate to="/" />;

    return children;
};

import PriceFilter from './pages/Home/PriceFilter';
import InstallPWA from './components/InstallPWA';
import { LocationProvider, useLocation } from './context/LocationContext';

import { useEffect, useState } from 'react';

const AuthRedirectHandler = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            const redirectPath = localStorage.getItem('oauth_redirect_path');
            if (redirectPath) {
                console.log('AuthRedirect: Found pending path, navigating to:', redirectPath);
                localStorage.removeItem('oauth_redirect_path');
                navigate(redirectPath, { replace: true });
            }
        }
    }, [user, loading, navigate]);

    return null;
};

import { registerServiceWorker } from './utils/pushNotification';

const AdminRouteHandler = () => {
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
        localStorage.getItem('admin_auth') === 'true'
    );

    const handleLogin = () => {
        localStorage.setItem('admin_auth', 'true');
        setIsAdminAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_auth');
        setIsAdminAuthenticated(false);
    };

    if (!isAdminAuthenticated) {
        return <AdminLogin onLogin={handleLogin} />;
    }

    return <AdminDashboard onLogout={handleLogout} />;
};

import LocationFAB from './components/LocationFAB';
import { savePageState, loadPageState } from './utils/pageCache';

const AppContent = () => {
    const { toast, setToast } = useLocation();
    const routeLocation = useRouteLocation();
    const [isPageChanging, setIsPageChanging] = useState(false);
    const isFirstMount = React.useRef(true);

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            // Restore scroll for the current page if it exists
            const cached = loadPageState(routeLocation.pathname);
            if (cached && cached.scrollY) {
                window.scrollTo(0, cached.scrollY);
            }
            return;
        }

        // Save scroll position for the page we are leaving
        // We use a small hack here: routeLocation.pathname is the NEW pathname after navigation starts,
        // but since this effect runs after the switch, we might need a ref for the PREVIOUS pathname.
    }, []);

    // Track previous path to save its scroll
    const prevPathRef = React.useRef(routeLocation.pathname);

    useEffect(() => {
        if (prevPathRef.current !== routeLocation.pathname) {
            // Save state for the page we just left
            // For pages not using usePageCache, we at least save the scrollY
            const cached = loadPageState(prevPathRef.current);
            savePageState(prevPathRef.current, cached ? cached.data : {});
            
            prevPathRef.current = routeLocation.pathname;
        }

        setIsPageChanging(true);
        const timer = setTimeout(() => {
            setIsPageChanging(false);
            // On navigation finish, try to restore scroll
            const cached = loadPageState(routeLocation.pathname);
            if (cached && cached.scrollY) {
                window.scrollTo(0, cached.scrollY);
            }
        }, 800); 
        return () => clearTimeout(timer);
    }, [routeLocation.pathname]);

    return (
        <>
            {isPageChanging && <PageTransitionLoader />}
            <AuthRedirectHandler />
            <Suspense fallback={<LoadingSpinner fullPage />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/update-password" element={<UpdatePassword />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/category/:categoryName" element={<Categories />} />
                    <Route path="/trending" element={<TrendingProducts />} />
                    <Route path="/stores" element={<Stores />} />
                    <Route path="/product/:productId" element={<ProductDetails />} />
                    <Route path="/price-filter/:maxPrice" element={<PriceFilter />} />
                    <Route path="/cart" element={
                        <ProtectedRoute>
                            <Cart />
                        </ProtectedRoute>
                    } />

                    <Route path="/orders" element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    } />
                    <Route path="/orders/:orderId" element={
                        <ProtectedRoute>
                            <OrderDetails />
                        </ProtectedRoute>
                    } />

                    <Route path="/followed-stores" element={
                        <ProtectedRoute>
                            <FollowedStores />
                        </ProtectedRoute>
                    } />

                    <Route path="/wishlist" element={
                        <ProtectedRoute>
                            <Wishlist />
                        </ProtectedRoute>
                    } />

                    {/* Seller Routes */}
                    <Route path="/seller/signup" element={
                        <ProtectedRoute>
                            <Signup /> {/* Reuse signup or dedicated route */}
                        </ProtectedRoute>
                    } />

                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } />

                    <Route path="/seller/create-store" element={
                        <ProtectedRoute role="seller">
                            <CreateStore />
                        </ProtectedRoute>
                    } />

                    <Route path="/seller/dashboard" element={
                        <ProtectedRoute role="seller">
                            <SellerDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/seller/subscription" element={
                        <ProtectedRoute role="seller">
                            <Subscription />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                        <AdminRouteHandler />
                    } />


                    {/* About & Support */}
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/support" element={<HelpSupport />} />
                    <Route path="/:storeName" element={<PublicStore />} />
                    <Route path="/:storeName/section/:sectionName" element={<StoreSection />} />
                    <Route path="/:storeName/category/:categoryName" element={<StoreCategoryView />} />

                    {/* Legal Routes */}
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/refunds" element={<Refunds />} />

                    {/* Fallback */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
            <LocationOnboarding />
            <LocationFAB />
            <InstallPWA />
            <Toast
                message={toast?.message}
                type={toast?.type}
                onManualClose={() => setToast({ message: '', type: 'info' })}
            />
        </>
    );
};

function App() {
    useEffect(() => {
        registerServiceWorker();
    }, []);
    return (
        <Router>
            <AuthProvider>
                <LocationProvider>
                    <CartProvider>
                        <AppContent />
                    </CartProvider>
                </LocationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
