import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Pages
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Home from './pages/Home/Home';
import ForgotPassword from './pages/Auth/ForgotPassword';
import UpdatePassword from './pages/Auth/UpdatePassword';
import Categories from './pages/Categories/Categories';
import Cart from './pages/Cart/Cart';
import Orders from './pages/Orders/Orders';
import CreateStore from './pages/Seller/CreateStore';
import Search from './pages/Search/Search';
import SellerDashboard from './pages/Seller/Dashboard';
import Stores from './pages/Stores/Stores';
import PublicStore from './pages/Stores/PublicStore';
import StoreSection from './pages/Stores/StoreSection';
import ProductDetails from './pages/Product/ProductDetails';
import FollowedStores from './pages/Stores/FollowedStores';
import Profile from './pages/Profile/Profile';
import Wishlist from './pages/Wishlist/Wishlist';
import OrderDetails from './pages/Orders/OrderDetails';

const ProtectedRoute = ({ children, role }) => {
    const { user, profile, loading } = useAuth();

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (!user) return <Navigate to="/login" />;
    if (role && profile?.role !== role) return <Navigate to="/" />;

    return children;
};

import PriceFilter from './pages/Home/PriceFilter';
import InstallPWA from './components/InstallPWA';
import LocationOnboarding from './components/LocationOnboarding';
import { useEffect } from 'react';

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

function App() {
    useEffect(() => {
        registerServiceWorker();
    }, []);
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <AuthRedirectHandler />
                    <LocationOnboarding />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/update-password" element={<UpdatePassword />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/stores" element={<Stores />} />
                        <Route path="/store/:storeId" element={<PublicStore />} />
                        <Route path="/store/:storeId/section/:sectionName" element={<StoreSection />} />
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

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                    <InstallPWA />
                </CartProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
