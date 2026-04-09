import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../services/supabase';
import { Mail, ArrowLeft, Clock } from 'lucide-react';
import { useRateLimit, CLIENT_RATE_POLICIES } from '../../hooks/useRateLimit';
import { parseRateLimitError, formatCountdown } from '../../utils/rateLimitHandler';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { sendPasswordResetEmail } = useAuth();

    // Client-side rate limit (UX only — backend is the real enforcement layer)
    const {
        checkLimit,
        isLimited,
        secondsLeft,
        remaining,
    } = useRateLimit('forgotPassword', CLIENT_RATE_POLICIES.forgotPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ── Client-side rate limit check (UX guard) ──────────────────────────
        const { allowed } = checkLimit();
        if (!allowed) {
            setError(
                `Too many requests. Please wait ${formatCountdown(secondsLeft)} before trying again.`
            );
            return;
        }

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
            // ── Handle backend 429 rate limit response ────────────────────────
            const rateLimitInfo = parseRateLimitError(err);
            if (rateLimitInfo.isRateLimited) {
                setError(rateLimitInfo.userMessage);
            } else {
                setError(err.message);
            }
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
                            disabled={isLimited}
                            id="forgot-password-email"
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}
                    {message && <p className="success-message">{message}</p>}

                    {/* Rate limit countdown banner */}
                    {isLimited && (
                        <div className="rate-limit-banner">
                            <Clock size={15} />
                            <span>
                                Request limit reached. Retry in <strong>{formatCountdown(secondsLeft)}</strong>
                            </span>
                        </div>
                    )}

                    {/* Remaining attempts warning */}
                    {!isLimited && remaining <= 2 && remaining > 0 && (
                        <p className="attempts-warning">
                            {remaining} request{remaining !== 1 ? 's' : ''} remaining this hour
                        </p>
                    )}

                    <button
                        type="submit"
                        className="btn-primary auth-submit"
                        disabled={loading || isLimited}
                        id="forgot-password-submit"
                    >
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
        .input-group input:disabled { opacity: 0.6; cursor: not-allowed; background: #f8fafc; }

        .error-message { color: var(--error); font-size: 0.875rem; margin-bottom: 1rem; }
        .success-message { color: var(--success); font-size: 0.875rem; margin-bottom: 1rem; font-weight: 500; }
        .auth-submit { width: 100%; margin-top: 1rem; padding: 0.75rem; }
        .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .rate-limit-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          color: #c2410c;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 1rem;
          animation: fadeInDown 0.3s ease;
        }
        .rate-limit-banner strong { font-weight: 700; }

        .attempts-warning {
          color: #d97706;
          font-size: 0.78rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
          animation: fadeInDown 0.3s ease;
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default ForgotPassword;
