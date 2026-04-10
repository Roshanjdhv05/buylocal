import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle } from 'lucide-react';

const NotFound = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
            <Helmet>
                <title>Page Not Found | BuyLocal</title>
                <meta name="robots" content="noindex, follow" />
            </Helmet>
            <AlertTriangle size={64} color="#64748b" style={{ marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '0.5rem' }}>404 - Page Not Found</h1>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Sorry, the page you are looking for could not be found or has been removed.</p>
            <Link to="/" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#7c3aed', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
                Return Home
            </Link>
        </div>
    );
};

export default NotFound;
