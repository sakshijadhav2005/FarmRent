import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');

    useEffect(() => {
        const handleCallback = () => {
            const token = searchParams.get('token');
            const role = searchParams.get('role');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                setError('Authentication failed. Please try again.');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            if (token && role) {
                // Decode user info from token (basic JWT decode)
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const user = {
                        id: payload.id,
                        _id: payload.id,
                        role: role
                    };
                    
                    login(user, token);

                    // Navigate based on role
                    if (role === 'admin') {
                        navigate('/admin');
                    } else if (role === 'worker') {
                        navigate('/worker-dashboard');
                    } else if (role === 'driver') {
                        navigate('/driver-dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                } catch (err) {
                    console.error('Token decode error:', err);
                    setError('Authentication failed. Please try again.');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } else {
                setError('Invalid authentication response.');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, login]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-background">
            <div className="text-center">
                {error ? (
                    <div className="space-y-4">
                        <div className="text-red-400 text-lg">{error}</div>
                        <div className="text-brand-text-muted text-sm">Redirecting to login...</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto" />
                        <div className="text-brand-text-light text-lg">Completing authentication...</div>
                        <div className="text-brand-text-muted text-sm">Please wait</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
