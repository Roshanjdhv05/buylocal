import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../services/supabase';
import { Mail, Lock } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signIn } = useAuth();
    const navigate = useNavigate();

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
                    } else {
                        navigate('/');
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
        <div className="auth-container">
            <div className="auth-box glass-card">
                <h2>Welcome Back</h2>
                <p className="auth-subtitle">Login to your BuyLocal account</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <Mail size={18} />
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="forgot-password-link">
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>

            <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--grad-main);
        }
        .auth-box {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          text-align: center;
          background: white;
        }
        h2 { margin-bottom: 0.5rem; font-size: 2rem; color: var(--text-main); }
        .auth-subtitle { color: var(--text-muted); margin-bottom: 2rem; }
        
        .input-group {
          position: relative;
          margin-bottom: 1.25rem;
        }
        .input-group svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .input-group input {
          padding-left: 3rem;
        }

        .error-message { color: var(--error); font-size: 0.875rem; margin-bottom: 1rem; }
        .auth-submit { width: 100%; margin-top: 1rem; }
        .forgot-password-link { text-align: right; margin-top: -0.5rem; margin-bottom: 1rem; }
        .forgot-password-link a { color: var(--text-muted); font-size: 0.8125rem; transition: var(--transition); }
        .forgot-password-link a:hover { color: var(--primary); }
        .auth-switch { margin-top: 1.5rem; font-size: 0.9375rem; color: var(--text-muted); }
        .auth-switch a { color: var(--primary); font-weight: 600; }
      `}</style>
        </div>
    );
};

export default Login;
