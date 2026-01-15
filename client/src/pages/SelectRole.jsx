import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Tractor, User, Wrench, Truck, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

const SelectRole = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [selectedRole, setSelectedRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isGoogleAuth = searchParams.get('google') === 'true';

    useEffect(() => {
        // If not coming from Google OAuth, redirect to register
        if (!isGoogleAuth) {
            navigate('/register');
        }
    }, [isGoogleAuth, navigate]);

    const roles = [
        {
            id: 'farmer',
            icon: Tractor,
            title: t('roles.farmer', 'Farmer'),
            description: t('roles.farmerDesc', 'Rent equipment for your farming needs'),
            color: 'from-green-500 to-emerald-600',
            shadowColor: 'shadow-green-500/30'
        },
        {
            id: 'owner',
            icon: User,
            title: t('roles.owner', 'Equipment Owner'),
            description: t('roles.ownerDesc', 'List and rent out your farm equipment'),
            color: 'from-blue-500 to-indigo-600',
            shadowColor: 'shadow-blue-500/30'
        },
        {
            id: 'worker',
            icon: Wrench,
            title: t('roles.worker', 'Farm Worker'),
            description: t('roles.workerDesc', 'Find work opportunities on farms'),
            color: 'from-orange-500 to-amber-600',
            shadowColor: 'shadow-orange-500/30'
        },
        {
            id: 'driver',
            icon: Truck,
            title: t('roles.driver', 'Driver'),
            description: t('roles.driverDesc', 'Transport equipment and goods'),
            color: 'from-purple-500 to-violet-600',
            shadowColor: 'shadow-purple-500/30'
        }
    ];

    const handleRoleSelect = async () => {
        if (!selectedRole) {
            setError(t('errors.selectRole', 'Please select a role to continue'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/auth/google/complete-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for session cookies
                body: JSON.stringify({ role: selectedRole })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to complete registration');
            }

            // Login the user
            login(data.user, data.token);

            // Navigate based on role
            if (selectedRole === 'admin') {
                navigate('/admin');
            } else if (selectedRole === 'worker') {
                navigate('/worker-dashboard');
            } else if (selectedRole === 'driver') {
                navigate('/driver-dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Complete profile error:', err);
            setError(err.message || 'Failed to complete registration. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="theme-classic min-h-[calc(100vh-10rem)] py-8 flex items-center justify-center bg-brand-background">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute bg-brand-primary/20 rounded-full blur-3xl"
                    style={{ top: '10%', left: '-5%', width: '25rem', height: '25rem' }}></div>
                <div className="absolute bg-brand-accent/15 rounded-full blur-3xl"
                    style={{ bottom: '10%', right: '-5%', width: '22rem', height: '22rem' }}></div>
                <div className="absolute bg-brand-secondary/10 rounded-full blur-3xl"
                    style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '30rem', height: '30rem' }}></div>
            </div>

            <div className="relative w-full max-w-2xl mx-4">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-brand-accent/15 to-brand-secondary/20 blur-xl rounded-3xl"></div>

                {/* Main Card */}
                <div className="glass-card relative rounded-3xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-primary-dark shadow-glow-primary w-16 h-16 rounded-2xl mb-4">
                            <Sparkles className="text-white w-8 h-8" />
                        </div>
                        <h1 className="font-display font-bold text-brand-text-light text-2xl md:text-3xl mb-2">
                            {t('selectRole.title', 'Choose Your Role')}
                        </h1>
                        <p className="text-brand-text-muted">
                            {t('selectRole.subtitle', 'Select how you want to use FarmLink')}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-6 gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            {error}
                        </div>
                    )}

                    {/* Role Selection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {roles.map((role) => {
                            const Icon = role.icon;
                            const isSelected = selectedRole === role.id;

                            return (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`
                                        relative p-5 rounded-xl border-2 transition-all duration-300 text-left
                                        ${isSelected
                                            ? `border-brand-primary bg-brand-primary/10 ${role.shadowColor} shadow-lg`
                                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}
                                    `}
                                >
                                    {/* Selection Indicator */}
                                    {isSelected && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle2 className="w-6 h-6 text-brand-primary" />
                                        </div>
                                    )}

                                    {/* Icon */}
                                    <div className={`
                                        inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3
                                        bg-gradient-to-br ${role.color} shadow-lg ${role.shadowColor}
                                    `}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="font-semibold text-brand-text-light text-lg mb-1">
                                        {role.title}
                                    </h3>
                                    <p className="text-brand-text-muted text-sm">
                                        {role.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Continue Button */}
                    <button
                        type="button"
                        onClick={handleRoleSelect}
                        disabled={loading || !selectedRole}
                        className={`
                            w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-lg
                            transition-all duration-300
                            ${selectedRole
                                ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-500/20'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
                            disabled:opacity-50
                        `}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{t('common.processing', 'Processing...')}</span>
                            </>
                        ) : (
                            <span>{t('selectRole.continue', 'Continue')}</span>
                        )}
                    </button>

                    {/* Info Text */}
                    <p className="text-center text-brand-text-muted text-xs mt-4">
                        {t('selectRole.info', 'You can change your role later from your profile settings')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SelectRole;
