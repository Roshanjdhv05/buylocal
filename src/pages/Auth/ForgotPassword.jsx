import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../services/supabase';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { sendPasswordResetEmail } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // 1. Verify if email exists in public.users table
            const { data, error: userError } = await withTimeout(supabase
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase())
                .single());

            if (userError || !data) {
                throw new Error('No account found with this email address.');
            }

            // 2. Send reset email
            await sendPasswordResetEmail(email.toLowerCase());
            setMessage('Password reset link has been sent to your email.');
            setEmail('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box glass-card">
                <Link to="/login" className="back-link">
                    <ArrowLeft size={16} /> Back to Login
                </Link>
                <h2>Forgot Password?</h2>
                <p className="auth-subtitle">Enter your registered email to receive a reset link.</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <Mail size={18} />
                        <input
                            type="email"
                            placeholder="Registered Email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}
                    {message && <p className="success-message">{message}</p>}

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
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
          position: relative;
        }
        .back-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-muted);
            font-size: 0.875rem;
            text-decoration: none;
            margin-bottom: 2rem;
            transition: var(--transition);
        }
        .back-link:hover { color: var(--primary); }
        
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
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          outline: none;
          transition: var(--transition);
        }
        .input-group input:focus { border-color: var(--primary); }

        .error-message { color: var(--error); font-size: 0.875rem; margin-bottom: 1rem; }
        .success-message { color: var(--success); font-size: 0.875rem; margin-bottom: 1rem; font-weight: 500; }
        .auth-submit { width: 100%; margin-top: 1rem; padding: 0.75rem; }
      `}</style>
        </div>
    );
};

export default ForgotPassword;
