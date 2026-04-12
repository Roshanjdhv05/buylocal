import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './AdminDashboard.css';

const AdminLogin = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (credentials.username === 'bylocal' && credentials.password === '1234567') {
            onLogin();
        } else {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-brand">
                    <h2>BuyLocal <span>Admin</span></h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={credentials.username}
                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                            placeholder="Enter username"
                            required
                        />
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            placeholder="Enter password"
                            required
                            style={{ paddingRight: '3rem' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            tabIndex={-1}
                            style={{
                                position: 'absolute', right: '1rem', bottom: '0.75rem',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0
                            }}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="admin-login-btn">Login to Dashboard</button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
