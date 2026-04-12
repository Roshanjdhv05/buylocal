import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, withTimeout } from '../../services/supabase';
import { Mail, Lock, ArrowLeft, Clock, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';
import { useTranslation } from 'react-i18next';
import { useRateLimit, CLIENT_RATE_POLICIES } from '../../hooks/useRateLimit';
import { parseRateLimitError, formatCountdown } from '../../utils/rateLimitHandler';

const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Client-side rate limiting (UX only — backend enforces the real limit)
    const {
        checkLimit,
        isLimited,
        secondsLeft,
        remaining,
        maxRequests,
        hasAttempted,
        reset: resetRateLimit,
    } = useRateLimit('login', CLIENT_RATE_POLICIES.auth);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            // Save current "from" state to localStorage so it persists through OAuth redirect
            const from = location.state?.from?.pathname || '/';
            localStorage.setItem('oauth_redirect_path', from);
            await signInWithGoogle();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        // ── Client-side rate limit check (UX guard) ────────────────────────
        const { allowed } = checkLimit();
        if (!allowed) {
            setError(
                `Too many login attempts. Please wait ${formatCountdown(secondsLeft)} before trying again.`
            );
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Login: Attempting sign in...');
            const { user, session } = await signIn(email, password);
            console.log('Login: Sign in success, session established.');

            resetRateLimit(); // Clear client-side counter on success

            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });

        } catch (err) {
            console.error('Login: Submit error:', err.message);

            // ── Handle backend 429 rate limit response ─────────────────────
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
        <AuthLayout>
            <div className="auth-nav-top">
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} />
                    <span>{t('common.back')}</span>
                </Link>
            </div>
            <div className="auth-form-header">
                <h2 className="auth-form-title">{t('auth.welcomeBack')}</h2>
                <p className="auth-form-subtitle">{t('auth.loginToContinue')}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-refined">
                <div className="auth-input-refined">
                    <input
                        type="email"
                        placeholder={t('auth.email')}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="auth-input-refined auth-input-password">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth.password')}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className="pw-toggle-btn"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="forgot-password-link-refined">
                    <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
                </div>

                {error && <p className="auth-error-refined">{error}</p>}

                {/* Attempts feedback — visible from the very first failed attempt */}
                {hasAttempted && !isLimited && (
                    <div className="auth-attempts-tracker">
                        <div className="auth-attempts-bar-wrap">
                            <div
                                className="auth-attempts-bar-fill"
                                style={{
                                    width: `${((maxRequests - remaining) / maxRequests) * 100}%`,
                                    background: remaining <= 2
                                        ? '#ef4444'
                                        : remaining <= 5
                                        ? '#f59e0b'
                                        : '#22c55e',
                                }}
                            />
                        </div>
                        <p className={`auth-attempts-text ${
                            remaining <= 2 ? 'danger' : remaining <= 5 ? 'warn' : 'safe'
                        }`}>
                            {remaining} of {maxRequests} attempt{remaining !== 1 ? 's' : ''} remaining
                            {remaining <= 5 && ' — be careful'}
                        </p>
                    </div>
                )}

                {/* Full block: countdown banner */}
                {isLimited && (
                    <div className="auth-rate-limit-banner">
                        <Clock size={16} />
                        <span>
                            Too many attempts. Try again in <strong>{formatCountdown(secondsLeft)}</strong>
                        </span>
                    </div>
                )}

                <button
                    type="submit"
                    className="auth-submit-refined"
                    disabled={loading || isLimited}
                    id="login-submit-btn"
                >
                    {loading ? t('common.loading') : t('nav.login')}
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
                {t('auth.dontHaveAccount')} <Link to="/signup">{t('nav.signUp')}</Link>
            </div>

            <style>{`
                .auth-form-header { margin-bottom: 2.5rem; text-align: left; }
                .auth-form-title { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
                .auth-form-subtitle { color: #64748b; font-size: 1.1rem; }

                .auth-nav-top {
                    margin-bottom: 2rem;
                }
                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.95rem;
                    transition: color 0.2s;
                }
                .back-link:hover {
                    color: #7c3aed;
                }

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

                .auth-input-password {
                    position: relative;
                }
                .auth-input-password input {
                    padding-right: 3rem;
                }
                .pw-toggle-btn {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 0;
                    transition: color 0.2s;
                }
                .pw-toggle-btn:hover { color: #7c3aed; }

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

                .auth-rate-limit-banner {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.85rem 1.25rem;
                    background: #fff1f2;
                    border: 1px solid #fecdd3;
                    border-radius: 10px;
                    color: #be123c;
                    font-size: 0.875rem;
                    font-weight: 500;
                    animation: fadeInDown 0.3s ease;
                }
                .auth-rate-limit-banner strong { font-weight: 700; }

                /* Attempt tracker: progress bar + label */
                .auth-attempts-tracker {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                    animation: fadeInDown 0.25s ease;
                }
                .auth-attempts-bar-wrap {
                    width: 100%;
                    height: 5px;
                    background: #f1f5f9;
                    border-radius: 99px;
                    overflow: hidden;
                }
                .auth-attempts-bar-fill {
                    height: 100%;
                    border-radius: 99px;
                    transition: width 0.4s ease, background 0.4s ease;
                }
                .auth-attempts-text {
                    font-size: 0.78rem;
                    font-weight: 500;
                    text-align: right;
                }
                .auth-attempts-text.safe  { color: #16a34a; }
                .auth-attempts-text.warn  { color: #d97706; }
                .auth-attempts-text.danger { color: #dc2626; }

                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

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
