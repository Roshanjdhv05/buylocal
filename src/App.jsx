import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Pages
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Home from './pages/Home/Home';
import Categories from './pages/Categories/Categories';
import Cart from './pages/Cart/Cart';
import Orders from './pages/Orders/Orders';
import CreateStore from './pages/Seller/CreateStore';
import SellerDashboard from './pages/Seller/Dashboard';
import Stores from './pages/Stores/Stores';
import PublicStore from './pages/Stores/PublicStore';
import ProductDetails from './pages/Product/ProductDetails';
import FollowedStores from './pages/Stores/FollowedStores';
import Profile from './pages/Profile/Profile';

const ProtectedRoute = ({ children, role }) => {
    const { user, profile, loading } = useAuth();

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (!user) return <Navigate to="/login" />;
    if (role && profile?.role !== role) return <Navigate to="/" />;

    return children;
};

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/stores" element={<Stores />} />
                        <Route path="/store/:storeId" element={<PublicStore />} />
                        <Route path="/product/:productId" element={<ProductDetails />} />
                        <Route path="/cart" element={<Cart />} />

                        <Route path="/orders" element={
                            <ProtectedRoute>
                                <Orders />
                            </ProtectedRoute>
                        } />

                        <Route path="/followed-stores" element={
                            <ProtectedRoute>
                                <FollowedStores />
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
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
