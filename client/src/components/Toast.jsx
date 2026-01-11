import React, { useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const bgColor = type === 'success' ? 'bg-brand-primary' : type === 'error' ? 'bg-red-500' : 'bg-brand-accent';
    const Icon = type === 'success' ? Check : type === 'error' ? AlertCircle : X;

    return (
        <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-slideIn`}>
            <Icon className="h-5 w-5" />
            <span>{message}</span>
        </div>
    );
};

export default Toast;
