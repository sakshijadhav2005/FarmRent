import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Tractor, Sparkles, Eye, EyeOff, Shield, Zap } from 'lucide-react';

/**
 * SINGLE SCREEN LOGIN PAGE
 * Compact design - fits between navbar and footer without scrolling
 */

const Login = () => {
    const { t } = useTranslation();
    const [emailOrMobile, setEmailOrMobile] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = { email: emailOrMobile, password };
            const data = await loginUser(payload);

            // Check if login was successful
            if (!data.success) {
                setError(data.message || "Login failed. Please check your credentials.");
                return;
            }

            login(data.user, data.token);

            // Navigate based on role
            if (data.user.role === 'admin') {
                navigate("/admin");
            } else if (data.user.role === 'worker') {
                navigate("/worker-dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            setError(err.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="theme-classic min-h-[calc(100vh-10rem)] py-4 flex items-center justify-center bg-brand-background">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute bg-brand-primary/20 rounded-full blur-3xl"
                    style={{ top: '20%', left: '-5%', width: '20rem', height: '20rem' }}></div>
                <div className="absolute bg-brand-accent/15 rounded-full blur-3xl"
                    style={{ bottom: '20%', right: '-5%', width: '18rem', height: '18rem' }}></div>
            </div>

            <div className="relative w-full max-w-sm mx-4">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-brand-accent/15 to-brand-secondary/20 blur-xl rounded-2xl"></div>

                {/* Login Card - Compact */}
                <div className="glass-card relative rounded-2xl" style={{ padding: '1.5rem' }}>
                    {/* Header - Compact */}
                    <div className="text-center" style={{ marginBottom: '1.25rem' }}>
                        <div className="inline-flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-primary-dark shadow-glow-primary"
                            style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', marginBottom: '0.75rem' }}>
                            <Tractor className="text-white" style={{ width: '1.5rem', height: '1.5rem' }} />
                        </div>
                        <h1 className="font-display font-bold text-brand-text-light" style={{ fontSize: '1.5rem' }}>
                            {t('auth.loginTitle')}
                        </h1>
                        <p className="text-brand-text-muted" style={{ fontSize: '0.875rem' }}>
                            {t('auth.loginSubtitle')}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg"
                            style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem', gap: '0.5rem' }}>
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            {error}
                        </div>
                    )}

                    {/* Login Form - Compact spacing */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {/* Email/Mobile Field */}
                        <div>
                            <label className="text-brand-text-light font-medium text-sm block mb-1">
                                {t('auth.email')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted w-4 h-4" />
                                <input
                                    type="text"
                                    className="input-field pl-10 py-2.5 text-sm"
                                    placeholder="Enter your email or mobile"
                                    value={emailOrMobile}
                                    onChange={(e) => setEmailOrMobile(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="text-brand-text-light font-medium text-sm block mb-1">
                                {t('auth.password')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted w-4 h-4" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-field pl-10 pr-10 py-2.5 text-sm"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-light transition-colors">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold shadow-lg shadow-yellow-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="font-bold text-sm">{t('auth.signIn')}</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 bg-brand-surface text-brand-text-muted text-xs">{t('auth.noAccount')}</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <Link to="/register"
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold shadow-lg shadow-yellow-500/20 transition-all duration-200">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">{t('auth.signUp')}</span>
                    </Link>

                    {/* Trust Badges - Compact */}
                    <div className="flex items-center justify-center gap-4 mt-4 text-brand-text-muted text-xs">
                        <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-brand-success" />
                            <span>Secure</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-brand-primary" />
                            <span>Fast Login</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
