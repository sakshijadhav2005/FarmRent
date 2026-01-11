import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { registerUser } from "../api";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Phone, Lock, ArrowRight, Tractor, Sprout, Wrench, Eye, EyeOff, CheckCircle, Car } from "lucide-react";

/**
 * SINGLE SCREEN REGISTER PAGE
 * Compact design - fits between navbar and footer without scrolling
 */

const Register = () => {
    const { t } = useTranslation();
    const [role, setRole] = useState("farmer");
    const [form, setForm] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const validateForm = () => {
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters");
            return false;
        }
        if (!form.name || !form.email || !form.mobile || !form.password) {
            setError("All fields are required");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            mobile: form.mobile.trim(),
            password: form.password,
            role
        };

        try {
            const response = await registerUser(payload);
            if (response.success) {
                login(response.user, response.token);
                // Navigate based on role
                if (response.user.role === 'worker') {
                    navigate("/worker-dashboard");
                } else if (response.user.role === 'driver') {
                    navigate("/driver-dashboard");
                } else {
                    navigate("/dashboard");
                }
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { id: 'farmer', labelKey: 'auth.farmer', icon: Sprout, gradient: 'from-brand-primary to-brand-primary-dark' },
        { id: 'owner', labelKey: 'auth.owner', icon: Tractor, gradient: 'from-brand-accent to-brand-accent-dark' },
        { id: 'worker', labelKey: 'auth.worker', icon: Wrench, gradient: 'from-brand-secondary to-brand-secondary-dark' },
        { id: 'driver', labelKey: 'Driver', icon: Car, gradient: 'from-brand-accent-dark to-brand-accent' },
    ];

    return (
        <div className="theme-classic min-h-[calc(100vh-10rem)] py-4 flex items-center justify-center bg-brand-background">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute bg-brand-primary/15 rounded-full blur-3xl"
                    style={{ top: '15%', left: '-5%', width: '18rem', height: '18rem' }}></div>
                <div className="absolute bg-brand-secondary/10 rounded-full blur-3xl"
                    style={{ top: '10%', right: '-5%', width: '15rem', height: '15rem' }}></div>
                <div className="absolute bg-brand-accent/10 rounded-full blur-3xl"
                    style={{ bottom: '15%', left: '30%', width: '14rem', height: '14rem' }}></div>
            </div>

            <div className="relative w-full max-w-md mx-4">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-brand-accent/15 to-brand-secondary/20 blur-xl rounded-2xl"></div>

                {/* Registration Card - Compact */}
                <div className="glass-card relative rounded-2xl" style={{ padding: '1.25rem' }}>
                    {/* Header - Compact */}
                    <div className="text-center" style={{ marginBottom: '1rem' }}>
                        <div className="inline-flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-accent shadow-glow-primary"
                            style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', marginBottom: '0.5rem' }}>
                            <User className="text-white w-5 h-5" />
                        </div>
                        <h1 className="font-display font-bold text-brand-text-light text-xl">{t('auth.registerTitle')}</h1>
                        <p className="text-brand-text-muted text-xs">{t('auth.registerSubtitle')}</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg mb-3"
                            style={{ padding: '0.5rem 0.75rem', gap: '0.375rem' }}>
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Role Selection - Compact */}
                        <div>
                            <label className="text-brand-text-light font-medium text-xs block mb-1.5">{t('auth.role')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {roles.map((r) => {
                                    const Icon = r.icon;
                                    const isSelected = role === r.id;
                                    return (
                                        <button key={r.id} type="button" onClick={() => setRole(r.id)}
                                            className={`relative text-center py-2 px-2 rounded-lg transition-all duration-200 ${isSelected
                                                ? `bg-gradient-to-br ${r.gradient} text-white shadow-md`
                                                : 'border border-white/10 text-brand-text hover:border-white/20'
                                                }`}>
                                            <Icon className="mx-auto w-4 h-4 mb-0.5" />
                                            <span className="text-xs font-semibold">{t(r.labelKey)}</span>
                                            {isSelected && <CheckCircle className="absolute top-1 right-1 w-3 h-3 text-white" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Two Column Layout for Name & Email */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Name Field */}
                            <div>
                                <label className="text-brand-text-light font-medium text-xs block mb-1">{t('auth.name')}</label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted w-3.5 h-3.5" />
                                    <input type="text" name="name" value={form.name}
                                        className="input-field pl-8 py-2 text-sm w-full" placeholder="Your name"
                                        onChange={handleChange} required />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="text-brand-text-light font-medium text-xs block mb-1">{t('auth.email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted w-3.5 h-3.5" />
                                    <input type="email" name="email" value={form.email}
                                        className="input-field pl-8 py-2 text-sm w-full" placeholder="Email address"
                                        onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        {/* Two Column Layout for Mobile & Password */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Mobile Field */}
                            <div>
                                <label className="text-brand-text-light font-medium text-xs block mb-1">{t('auth.phone')}</label>
                                <div className="relative">
                                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted w-3.5 h-3.5" />
                                    <input type="tel" name="mobile" value={form.mobile}
                                        className="input-field pl-8 py-2 text-sm w-full" placeholder="Mobile number"
                                        onChange={handleChange} required />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="text-brand-text-light font-medium text-xs block mb-1">{t('auth.password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted w-3.5 h-3.5" />
                                    <input type={showPassword ? "text" : "password"} name="password" value={form.password}
                                        className="input-field pl-8 pr-8 py-2 text-sm w-full" placeholder="Min 6 chars"
                                        onChange={handleChange} required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-light">
                                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Password Strength - Inline */}
                        {form.password && (
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-brand-text-muted">Strength:</span>
                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all ${form.password.length < 6 ? 'w-1/4 bg-red-500' :
                                        form.password.length < 8 ? 'w-1/2 bg-yellow-500' :
                                            form.password.length < 12 ? 'w-3/4 bg-brand-primary' : 'w-full bg-brand-success'
                                        }`}></div>
                                </div>
                                <span className={`font-medium ${form.password.length < 6 ? 'text-red-400' :
                                    form.password.length < 8 ? 'text-yellow-400' :
                                        form.password.length < 12 ? 'text-brand-primary-light' : 'text-brand-success'
                                    }`}>
                                    {form.password.length < 6 ? 'Weak' : form.password.length < 8 ? 'Fair' : form.password.length < 12 ? 'Good' : 'Strong'}
                                </span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 mt-1 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold shadow-lg shadow-yellow-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="font-bold text-sm">{t('auth.signUp')}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link - Compact */}
                    <div className="text-center border-t border-white/10 mt-3 pt-3">
                        <p className="text-brand-text-muted text-xs">
                            {t('auth.hasAccount')}{' '}
                            <Link to="/login" className="text-brand-primary-light font-semibold hover:text-brand-primary">
                                {t('auth.signIn')}
                            </Link>
                        </p>
                    </div>

                    {/* Terms - Compact */}
                    <p className="text-brand-text-muted text-center text-[10px] mt-2 leading-tight">
                        By creating an account, you agree to our{' '}
                        <a href="#" className="text-brand-primary-light hover:underline">Terms</a> &{' '}
                        <a href="#" className="text-brand-primary-light hover:underline">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
