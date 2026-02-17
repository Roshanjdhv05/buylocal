import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../services/supabase';
import { Mail, Lock } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('Login: Attempting sign in...');
            const { user } = await signIn(email, password);
            console.log('Login: Sign in success, user:', user.email);

            // Short delay to allow AuthContext to sync local profile
            // This prevents a race where we redirect before profile is loaded
            setTimeout(async () => {
                try {
                    const { data: profileData } = await withTimeout(supabase
                        .from('users')
                        .select('role')
                        .eq('id', user.id)
                        .single());

                    if (profileData?.role === 'seller') {
                        const { data: storeData } = await withTimeout(supabase
                            .from('stores')
                            .select('id')
                            .eq('owner_id', user.id)
                            .single());

                        if (storeData) navigate('/seller/dashboard');
                        else navigate('/seller/create-store');
                        if (storeData) navigate('/seller/dashboard');
                        else navigate('/seller/create-store');
                    } else {
                        // Check for redirect path
                        const from = location.state?.from?.pathname || '/';
                        navigate(from, { replace: true });
                    }
                } catch (e) {
                    console.warn('Login: Redirect logic partial fail, falling back to home', e.message);
                    navigate('/');
                }
            }, 500);

        } catch (err) {
            console.error('Login: Submit error:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-header">
                <h2 className="auth-form-title">Welcome Back</h2>
                <p className="auth-form-subtitle">Login to your BuyLocal account</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-refined">
                <div className="auth-input-refined">
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="auth-input-refined">
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="forgot-password-link-refined">
                    <Link to="/forgot-password">Forgot Password?</Link>
                </div>

                {error && <p className="auth-error-refined">{error}</p>}

                <button type="submit" className="auth-submit-refined" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log In'}
                </button>

                <div className="auth-divider">
                    <span>or continue with</span>
                </div>

                <button
                    type="button"
                    className="auth-google-btn"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                    Continue with Google
                </button>
            </form>

            <div className="auth-switch-refined">
                Don't have an account? <Link to="/signup">Sign Up</Link>
            </div>

            <style>{`
                .auth-form-header { margin-bottom: 2.5rem; text-align: left; }
                .auth-form-title { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
                .auth-form-subtitle { color: #64748b; font-size: 1.1rem; }

                .auth-form-refined { display: flex; flex-direction: column; gap: 1.25rem; }
                
                .auth-input-refined input {
                    width: 100%;
                    padding: 1.2rem 1.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    background: #fff;
                    transition: all 0.2s;
                    color: #1a1a1a;
                }

                .auth-input-refined input:focus {
                    border-color: #7c3aed;
                    outline: none;
                    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
                }

                .forgot-password-link-refined { text-align: right; margin-top: -0.5rem; }
                .forgot-password-link-refined a { color: #64748b; font-size: 0.85rem; font-weight: 500; }
                
                .auth-error-refined { color: #ef4444; font-size: 0.875rem; font-weight: 500; }

                .auth-submit-refined {
                    margin-top: 1rem;
                    padding: 1.2rem;
                    background: #7c3aed;
                    color: white;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 1rem;
                    box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3);
                    transition: all 0.2s;
                }
                .auth-submit-refined:hover { transform: translateY(-1px); box-shadow: 0 20px 25px -5px rgba(124, 58, 237, 0.4); background: #6d28d9; }
                .auth-submit-refined:active { transform: translateY(0); }
                .auth-submit-refined:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

                .auth-divider {
                    margin: 1.5rem 0;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    color: #94a3b8;
                    font-size: 0.85rem;
                }
                .auth-divider::before, .auth-divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }

                .auth-google-btn {
                    width: 100%;
                    padding: 0.8rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    color: #1e293b;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    transition: all 0.2s;
                }
                .auth-google-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
                .auth-google-btn img { width: 18px; height: 18px; }

                .auth-switch-refined {
                    margin-top: 2.5rem;
                    text-align: center;
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1e293b;
                }
                .auth-switch-refined a {
                    color: #1e293b;
                    text-decoration: underline;
                    margin-left: 5px;
                }
            `}</style>
        </AuthLayout>
    );
};

export default Login;
