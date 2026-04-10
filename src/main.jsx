import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n'


ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <HelmetProvider>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </HelmetProvider>
    </React.StrictMode>,
)
