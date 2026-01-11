import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Tractor, Menu, X, LogOut, User, List, Calendar, Settings, BarChart3, Users, Heart, Linkedin, Github, UserCheck, Sun, Mic } from 'lucide-react';

// ... (rest of imports)

// ... inside MainLayout component ...

import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import ChatWidget from '../components/ChatWidget';
import LanguageSwitcher from '../components/LanguageSwitcher';

/**
 * GOLDEN RATIO LAYOUT
 * φ = 1.618033988749895
 * 
 * Layout proportions:
 * - Sidebar: 38.2% of available space (max 272px based on φ)
 * - Content: 61.8% of available space
 * - All spacing uses φ-based values
 */

const MainLayout = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isPublicPage = ['/', '/login', '/register', '/home'].includes(location.pathname);
    const isActiveLink = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', labelKey: 'nav.dashboard', icon: BarChart3, roles: ['farmer', 'owner'] },
        { path: '/work-planner', labelKey: 'nav.workPlanner', icon: Sun, roles: ['farmer'] },
        { path: '/voice-assistant', labelKey: 'nav.voiceAssistant', icon: Mic, roles: ['farmer', 'owner'] },
        { path: '/addequipment', labelKey: 'nav.myEquipment', icon: Tractor, roles: ['owner'] },
        { path: '/find-workers', labelKey: 'nav.findWorkers', icon: Users, roles: ['farmer', 'owner'] },
        { path: '/worker-details', labelKey: 'dashboard.workRequests', icon: UserCheck, roles: ['farmer', 'owner'] },
        { path: '/worker-dashboard', labelKey: 'nav.workDashboard', icon: BarChart3, roles: ['worker'] },
        { path: '/bookings', labelKey: 'nav.bookings', icon: Calendar, roles: ['farmer', 'owner'] },
        { path: '/settings', labelKey: 'nav.settings', icon: Settings, roles: ['farmer', 'owner', 'worker'] },
        { path: '/admin', labelKey: 'nav.admin', icon: Settings, roles: ['admin'] },
    ];

    const filteredNavItems = navItems.filter(item =>
        !item.roles || item.roles.includes(user?.role)
    );

    // Golden Ratio values
    const phi = {
        spacing: {
            xs: '0.236rem',   // φ⁻³
            sm: '0.382rem',   // φ⁻²
            md: '0.618rem',   // φ⁻¹
            base: '1rem',     // φ⁰
            lg: '1.618rem',   // φ¹
            xl: '2.618rem',   // φ²
            '2xl': '4.236rem', // φ³
        },
        radius: {
            sm: '0.382rem',
            md: '0.618rem',
            lg: '1rem',
            xl: '1.618rem',
        }
    };

    return (
        <div className="min-h-screen bg-brand-background text-brand-text font-body flex flex-col antialiased relative overflow-hidden">
            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 pointer-events-none z-0 mesh-bg-phi opacity-60"></div>

            {/* Navigation Bar - φ proportioned height */}
            <nav className="sticky top-0 z-50 backdrop-blur-3xl bg-brand-surface/80 border-b border-white/5"
                style={{ height: '4.236rem' }}>
                <div style={{ maxWidth: '1618px', margin: '0 auto', padding: '0 1.618rem', height: '100%' }}>
                    <div className="flex items-center justify-between h-full">
                        {/* Logo - φ proportioned */}
                        <Link to="/" className="flex items-center group" style={{ gap: '0.618rem' }}>
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-primary/30 blur-lg group-hover:bg-brand-primary/50 transition-phi"
                                    style={{ borderRadius: '0.618rem' }}></div>
                                <div className="relative bg-gradient-to-br from-brand-primary to-brand-primary-dark"
                                    style={{ padding: '0.618rem', borderRadius: '0.618rem' }}>
                                    <Tractor className="text-white" style={{ width: '1.618rem', height: '1.618rem' }} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-display font-bold bg-gradient-to-r from-brand-primary-light via-brand-secondary-light to-brand-accent-light bg-clip-text text-transparent leading-none"
                                    style={{ fontSize: '2rem' }}>

                                </span>
                                <span className="text-white/60 font-medium tracking-wide"
                                    style={{ fontSize: '1.75rem' }}>
                                    FarmRent
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center" style={{ gap: '0.618rem' }}>
                            <Link to="/"
                                className={`font-medium transition-phi ${isActiveLink('/')
                                    ? 'bg-brand-primary/20 text-brand-primary-light'
                                    : 'text-brand-text hover:bg-white/5 hover:text-brand-text-light'
                                    }`}
                                style={{ padding: '0.618rem 1rem', borderRadius: '0.618rem', fontSize: '0.938rem' }}>
                                {t('nav.home')}
                            </Link>

                            {user ? (
                                <>
                                    <Link to="/dashboard"
                                        className={`font-medium transition-phi ${isActiveLink('/dashboard')
                                            ? 'bg-brand-primary/20 text-brand-primary-light'
                                            : 'text-brand-text hover:bg-white/5 hover:text-brand-text-light'
                                            }`}
                                        style={{ padding: '0.618rem 1rem', borderRadius: '0.618rem', fontSize: '0.938rem' }}>
                                        {t('nav.dashboard')}
                                    </Link>
                                    <div className="bg-white/10" style={{ width: '1px', height: '1.618rem', margin: '0 0.618rem' }}></div>
                                    {/* Notification Bell */}
                                    <NotificationBell />
                                    <Link to="/wishlist" className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Wishlist">
                                        <Heart className="w-5 h-5 text-brand-text-light" />
                                    </Link>
                                    <div className="flex items-center" style={{ gap: '0.618rem' }}>
                                        <div className="flex items-center" style={{ gap: '0.382rem' }}>
                                            <div className="rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold"
                                                style={{ width: '2.058rem', height: '2.058rem', fontSize: '0.875rem' }}>
                                                {user.name?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="text-brand-text-light font-medium" style={{ fontSize: '0.938rem' }}>
                                                {user.name}
                                            </span>
                                        </div>
                                        <button onClick={handleLogout}
                                            className="flex items-center font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-phi"
                                            style={{ padding: '0.618rem 1rem', borderRadius: '0.618rem', fontSize: '0.938rem', gap: '0.382rem' }}>
                                            <LogOut style={{ width: '1rem', height: '1rem' }} />
                                            <span>{t('nav.logout')}</span>
                                        </button>
                                    </div>
                                    {/* Language Switcher */}
                                    <LanguageSwitcher />
                                </>
                            ) : (
                                <div className="flex items-center" style={{ gap: '0.618rem' }}>
                                    <LanguageSwitcher />
                                    <Link to="/login"
                                        className="font-medium text-brand-text hover:bg-white/5 hover:text-brand-text-light transition-phi"
                                        style={{ padding: '0.618rem 1rem', borderRadius: '0.618rem', fontSize: '0.938rem' }}>
                                        {t('nav.login')}
                                    </Link>
                                    <Link to="/register" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-900/20 group-hover:shadow-emerald-500/30 transition-all" style={{ padding: '0.618rem 1.618rem', fontSize: '0.938rem' }}>
                                        <span>{t('nav.register')}</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden hover:bg-white/5 transition-phi"
                            style={{ padding: '0.618rem', borderRadius: '0.618rem' }}>
                            {isMenuOpen
                                ? <X style={{ width: '1.618rem', height: '1.618rem' }} />
                                : <Menu style={{ width: '1.618rem', height: '1.618rem' }} />
                            }
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-brand-surface/95 backdrop-blur-3xl border-t border-white/5"
                        style={{ padding: '1rem 1.618rem', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.382rem' }}>
                            <Link to="/" onClick={() => setIsMenuOpen(false)}
                                className="text-brand-text hover:bg-white/5 transition-phi flex items-center gap-3"
                                style={{ padding: '0.618rem 1rem', borderRadius: '0.618rem' }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                {t('nav.home')}
                            </Link>
                            {user ? (
                                <>
                                    {/* User Profile in Mobile */}
                                    <div className="flex items-center gap-3 p-3 bg-brand-primary/10 rounded-xl mb-2">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold">
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-brand-text-light">{user.name}</div>
                                            <div className="text-xs text-brand-text capitalize">{user.role}</div>
                                        </div>
                                    </div>

                                    {/* Mobile Navigation Items - Same as Sidebar */}
                                    {filteredNavItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link key={item.path} to={item.path} onClick={() => setIsMenuOpen(false)}
                                                className={`flex items-center gap-3 transition-phi ${isActiveLink(item.path)
                                                    ? 'bg-brand-primary/20 text-brand-primary-light'
                                                    : 'text-brand-text hover:bg-white/5'
                                                    }`}
                                                style={{ padding: '0.75rem 1rem', borderRadius: '0.618rem' }}>
                                                <Icon className="w-5 h-5" />
                                                <span className="font-medium">{t(item.labelKey)}</span>
                                            </Link>
                                        );
                                    })}

                                    {/* Wishlist */}
                                    <Link to="/wishlist" onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 text-brand-text hover:bg-white/5 transition-phi"
                                        style={{ padding: '0.75rem 1rem', borderRadius: '0.618rem' }}>
                                        <Heart className="w-5 h-5" />
                                        <span className="font-medium">{t('nav.wishlist') || 'Wishlist'}</span>
                                    </Link>

                                    {/* Divider */}
                                    <div className="border-t border-white/10 my-2"></div>

                                    {/* Logout */}
                                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                        className="flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-phi w-full text-left"
                                        style={{ padding: '0.75rem 1rem', borderRadius: '0.618rem' }}>
                                        <LogOut className="w-5 h-5" />
                                        <span className="font-medium">{t('nav.logout')}</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setIsMenuOpen(false)}
                                        className="text-brand-text hover:bg-white/5 transition-phi flex items-center gap-3"
                                        style={{ padding: '0.75rem 1rem', borderRadius: '0.618rem' }}>
                                        <User className="w-5 h-5" />
                                        <span className="font-medium">{t('nav.login')}</span>
                                    </Link>
                                    <Link to="/register" onClick={() => setIsMenuOpen(false)}
                                        className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white font-medium transition-phi flex items-center justify-center gap-2"
                                        style={{ padding: '0.75rem 1rem', borderRadius: '0.618rem', marginTop: '0.5rem' }}>
                                        <span>{t('nav.register')}</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            <div className="flex flex-1">
                {/* Sidebar - 38.2% of 712px max = ~272px (based on φ) */}
                {user && !isPublicPage && (
                    <aside className="hidden md:block bg-brand-surface/50 backdrop-blur-xl border-r border-white/5"
                        style={{ width: '272px', flexShrink: 0 }}>
                        <div className="sticky" style={{ top: '4.236rem', padding: '1.618rem' }}>
                            {/* User Profile Card - φ proportions */}
                            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.618rem', borderRadius: '1.618rem' }}>
                                <div className="flex items-center" style={{ gap: '0.618rem' }}>
                                    <div className="relative">
                                        <div className="rounded-full bg-gradient-to-br from-brand-primary via-brand-accent to-brand-secondary flex items-center justify-center text-white font-bold"
                                            style={{ width: '2.618rem', height: '2.618rem', fontSize: '1.125rem' }}>
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="absolute bg-brand-success border-2 border-brand-surface rounded-full"
                                            style={{ bottom: '-2px', right: '-2px', width: '0.618rem', height: '0.618rem' }}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-display font-bold text-brand-text-light truncate" style={{ fontSize: '1rem' }}>
                                            {user.name}
                                        </h3>
                                        <span className="inline-flex items-center bg-brand-primary/20 text-brand-primary-light capitalize"
                                            style={{ padding: '0.146rem 0.382rem', borderRadius: '0.382rem', fontSize: '0.688rem', fontWeight: '600' }}>
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Items - φ spacing */}
                            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.236rem' }}>
                                {filteredNavItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isActiveLink(item.path);
                                    return (
                                        <Link key={item.path} to={item.path}
                                            className={`flex items-center transition-phi ${isActive
                                                ? 'bg-gradient-to-r from-brand-primary/20 to-transparent text-brand-primary-light'
                                                : 'text-brand-text hover:bg-white/5 hover:text-brand-text-light'
                                                }`}
                                            style={{
                                                padding: '0.618rem 1rem',
                                                borderRadius: '0.618rem',
                                                gap: '0.618rem',
                                                borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent'
                                            }}>
                                            <Icon style={{ width: '1.272rem', height: '1.272rem' }}
                                                className={isActive ? 'text-brand-primary' : ''} />
                                            <span className="font-medium" style={{ fontSize: '0.938rem' }}>{t(item.labelKey)}</span>
                                        </Link>
                                    );
                                })}

                                {/* Logout Button */}
                                <button onClick={handleLogout}
                                    className="flex items-center w-full text-brand-text hover:bg-red-500/10 hover:text-red-400 transition-phi"
                                    style={{ padding: '0.618rem 1rem', borderRadius: '0.618rem', gap: '0.618rem', marginTop: '1rem', borderLeft: '3px solid transparent' }}>
                                    <LogOut style={{ width: '1.272rem', height: '1.272rem' }} />
                                    <span className="font-medium" style={{ fontSize: '0.938rem' }}>{t('nav.logout')}</span>
                                </button>
                            </nav>
                        </div>
                    </aside>
                )}

                {/* Main Content - 61.8% (flexible) */}
                <main className={`flex-1 mx-auto w-full p-6 md:p-8 ${user && !isPublicPage ? 'pb-24 md:pb-8' : ''}`}
                    style={{
                        maxWidth: user && !isPublicPage ? '1000px' : '1618px',
                    }}>
                    <Outlet />
                </main>
            </div>

            {/* Footer - φ proportions */}
            {/* Footer - φ proportions */}
            <footer className="bg-brand-surface/50 backdrop-blur-xl border-t border-white/5 mt-auto"
                style={{ padding: '2.618rem 1.618rem' }}>
                <div style={{ maxWidth: '1618px', margin: '0 auto' }}>
                    <div className="flex flex-col items-center justify-center text-center space-y-4">

                        <p className="text-brand-text-muted" style={{ fontSize: '1rem' }}>
                            © 2025 FarmRent. All rights reserved.
                        </p>

                        <p className="text-brand-text-light font-medium" style={{ fontSize: '1.1rem' }}>
                            Developed by <span className="font-bold text-white">SAKSHI JADHAV</span> | JSPM's Rajarshi Shahu College of Engineering
                        </p>

                        <div className="flex items-center space-x-6 mt-4">
                            <a href="https://www.linkedin.com/in/sakshi-jadhav-3b5408337/" target="_blank" rel="noopener noreferrer" className="text-brand-text-muted hover:text-blue-400 transition-colors transform hover:scale-110">
                                <span className="flex items-center gap-2">
                                    <Linkedin size={20} /> LinkedIn
                                </span>
                            </a>
                            <a href="https://github.com/sakshijadhav2005" target="_blank" rel="noopener noreferrer" className="text-brand-text-muted hover:text-white transition-colors transform hover:scale-110">
                                <span className="flex items-center gap-2">
                                    <Github size={20} /> GitHub
                                </span>
                            </a>
                        </div>

                        <div className="flex items-center space-x-4 mt-6 text-sm text-brand-text-muted opacity-80">
                            <a href="#" className="hover:text-brand-primary-light transition-colors">Privacy Policy</a>
                            <span>•</span>
                            <a href="#" className="hover:text-brand-primary-light transition-colors">Terms of Service</a>
                            <span>•</span>
                            <a href="#" className="hover:text-brand-primary-light transition-colors">Cookie Policy</a>
                        </div>

                    </div>
                </div>
            </footer>

            {/* Mobile Bottom Navigation - Only on dashboard pages for logged-in users */}
            {user && !isPublicPage && (
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-surface/95 backdrop-blur-xl border-t border-white/10 z-40 safe-area-pb">
                    <div className="flex items-center justify-around py-2">
                        <Link to="/dashboard"
                            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${isActiveLink('/dashboard') ? 'text-brand-primary' : 'text-brand-text'}`}>
                            <BarChart3 className="w-5 h-5" />
                            <span className="text-xs mt-1">{t('nav.dashboard')}</span>
                        </Link>
                        <Link to="/bookings"
                            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${isActiveLink('/bookings') ? 'text-brand-primary' : 'text-brand-text'}`}>
                            <Calendar className="w-5 h-5" />
                            <span className="text-xs mt-1">{t('nav.bookings')}</span>
                        </Link>
                        <Link to="/wishlist"
                            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${isActiveLink('/wishlist') ? 'text-brand-primary' : 'text-brand-text'}`}>
                            <Heart className="w-5 h-5" />
                            <span className="text-xs mt-1">Wishlist</span>
                        </Link>
                        <Link to="/settings"
                            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${isActiveLink('/settings') ? 'text-brand-primary' : 'text-brand-text'}`}>
                            <Settings className="w-5 h-5" />
                            <span className="text-xs mt-1">{t('nav.settings')}</span>
                        </Link>
                    </div>
                </nav>
            )}

            {/* AI Chat Widget - Floating */}
            <ChatWidget />
        </div>
    );
};

export default MainLayout;
