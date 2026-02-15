import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Eye, EyeOff } from 'lucide-react';

const UpdatePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { updatePassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);
        setError('');

        try {
            await updatePassword(password);
            alert('Password updated successfully! Please login with your new password.');
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box glass-card">
                <h2>New Password</h2>
                <p className="auth-subtitle">Set your new account password below.</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <Lock size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="toggle-visibility"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="input-group">
                        <Lock size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
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
          width: 100%;
          padding: 0.75rem 3rem 0.75rem 3rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          outline: none;
          transition: var(--transition);
        }
        .input-group input:focus { border-color: var(--primary); }

        .toggle-visibility {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            color: var(--text-muted);
            border: none;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
        }

        .error-message { color: var(--error); font-size: 0.875rem; margin-bottom: 1rem; }
        .auth-submit { width: 100%; margin-top: 1rem; padding: 0.75rem; }
      `}</style>
        </div>
    );
};

export default UpdatePassword;
