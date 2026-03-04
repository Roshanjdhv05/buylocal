import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 3000, onManualClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration]);

    if (!message || !isVisible) return null;

    const icons = {
        success: <CheckCircle size={18} color="#22c55e" />,
        error: <AlertCircle size={18} color="#ef4444" />,
        info: <Info size={18} color="#3b82f6" />,
        loading: <Loader size={18} color="#6366f1" className="spinner" />
    };

    return (
        <div className={`toast-container ${type}`}>
            <div className="toast-icon">{icons[type]}</div>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={() => setIsVisible(false)}>
                <X size={14} />
            </button>
        </div>
    );
};

export default Toast;
