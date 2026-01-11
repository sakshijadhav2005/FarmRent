import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Simple router that redirects /dashboard to the role-specific dashboard
const DashboardRouter = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'owner') navigate('/dashboard/owner');
        else if (user.role === 'farmer') navigate('/dashboard/farmer');
        else if (user.role === 'worker') navigate('/worker-dashboard');
        else if (user.role === 'driver') navigate('/driver-dashboard');
        else navigate('/');
    }, [user, loading, navigate]);

    return null;
};

export default DashboardRouter;
