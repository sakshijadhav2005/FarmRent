import React from 'react';
import { Link } from 'react-router-dom';
import { Tractor, Users, TrendingUp, Shield, ArrowRight, Sparkles, Zap, Award, DollarSign, Leaf, Star, CheckCircle, ChevronRight, Heart, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

/**
 * GOLDEN RATIO HOME PAGE
 * All layouts follow φ (phi) = 1.618 proportions:
 * - Hero: 61.8vh height
 * - Section splits: 61.8% / 38.2%
 * - Spacing: φ-based increments
 * - Typography: 1.618 scale
 */

const Home = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    const features = [
        {
            icon: Tractor,
            titleKey: 'home.features.verified',
            descKey: 'home.features.verifiedDesc',
            gradient: 'from-brand-primary to-brand-primary-dark',
        },
        {
            icon: Zap,
            titleKey: 'home.features.weatherSmart',
            descKey: 'home.features.weatherSmartDesc',
            gradient: 'from-brand-secondary to-brand-secondary-dark',
        },
        {
            icon: Shield,
            titleKey: 'home.features.securePayments',
            descKey: 'home.features.securePaymentsDesc',
            gradient: 'from-brand-accent to-brand-accent-dark',
        },
    ];

    const stats = [
        { value: '500+', labelKey: 'home.stats.equipment' },
        { value: '2K+', labelKey: 'home.stats.farmers' },
        { value: '100+', labelKey: 'home.stats.villages' },
        { value: '5K+', labelKey: 'home.stats.bookings' },
    ];

    const farmerBenefits = [
        { textKey: 'home.farmersDesc', icon: DollarSign },
        { textKey: 'home.features.weatherSmartDesc', icon: Zap },
        { textKey: 'home.features.securePaymentsDesc', icon: Star },
        { textKey: 'home.features.supportDesc', icon: Shield },
    ];

    const ownerBenefits = [
        { textKey: 'home.ownersDesc', icon: TrendingUp },
        { textKey: 'home.features.verifiedDesc', icon: Users },
        { textKey: 'home.features.securePaymentsDesc', icon: DollarSign },
        { textKey: 'home.features.supportDesc', icon: Shield },
    ];

    return (
        <div className="flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
            {/* ================================
                NEW AESTHETIC HERO SECTION
            ================================ */}
            <section className="relative min-h-screen flex flex-col justify-between overflow-hidden">
                {/* Background Image - Natural Farm Vibe */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2500&auto=format&fit=crop"
                        alt="Farm Landscape"
                        className="w-full h-full object-cover"
                    />
                    {/* Overlay for text readability - Soft Green/Dark tint */}
                    <div className="absolute inset-0 bg-[#1a2e22]/40"></div>
                </div>

                {/* Top Spacer / Logo Area */}
                <div className="relative z-10 w-full p-6 flex justify-center">
                    <div className="opacity-90 mt-4">
                        <span className="bg-[#2d5a42] text-white px-4 py-1 rounded-sm text-sm tracking-widest uppercase font-semibold">

                        </span>
                    </div>
                </div>

                {/* Main Content - Centered */}
                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center justify-center flex-grow -mt-20">

                    {/* Main Heading - Serif, Elegant */}
                    <h1 className="text-white font-serif text-5xl md:text-7xl lg:text-8xl mb-6 drop-shadow-lg leading-tight">
                        {t('home.heroTitle')} <br />
                        <span className="italic">{t('home.heroTitleHighlight')}</span>
                    </h1>

                    {/* Green Divider */}
                    <div className="w-24 h-1 bg-[#4ade80] my-6 rounded-full"></div>

                    {/* Subheading - Natural/Handwritten vibe */}
                    <p className="text-white/90 text-xl md:text-2xl font-light tracking-wide max-w-2xl mb-12">
                        {t('home.heroSubtitle')}
                    </p>

                    {/* CTA Buttons - Always reserve space for them */}
                    <div className="flex flex-col items-center gap-6">

                        <div className="flex gap-6 mt-4">
                            {!user ? (
                                <>
                                    <Link to="/login"
                                        className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white font-serif text-lg tracking-wide hover:bg-white/20 transition-all duration-300 rounded-full shadow-lg hover:shadow-white/20 hover:-translate-y-1">
                                        {t('nav.login')}
                                    </Link>
                                    <Link to="/register"
                                        className="px-10 py-4 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#052e16] font-serif text-lg font-bold tracking-wide hover:brightness-110 transition-all duration-300 rounded-full shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_rgba(74,222,128,0.7)] hover:-translate-y-1">
                                        {t('nav.register')}
                                    </Link>
                                </>
                            ) : (
                                <Link to="/dashboard"
                                    className="px-10 py-4 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#052e16] font-serif text-lg font-bold tracking-wide hover:brightness-110 transition-all duration-300 rounded-full shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_rgba(74,222,128,0.7)] hover:-translate-y-1 flex items-center gap-3">
                                    {t('nav.dashboard')} <ArrowRight className="w-5 h-5" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Cards - "Discover our services" */}
                {/* Pushed to bottom using flex layout */}
                <div className="relative z-10 w-full mt-12 bg-gradient-to-t from-[#1a2e22] to-transparent pt-12 pb-0">
                    <div className="text-center mb-6">
                        <h2 className="text-white text-3xl md:text-4xl font-[cursive] opacity-90" style={{ fontFamily: '"Brush Script MT", cursive' }}>
                            {t('home.aesthetic.discover')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 w-full">
                        {[
                            { titleKey: 'home.aesthetic.services.rent', icon: Tractor, link: '/dashboard' },
                            { titleKey: 'home.aesthetic.services.hire', icon: Users, link: '/find-workers' },
                            { titleKey: 'home.aesthetic.services.list', icon: TrendingUp, link: '/addequipment' },
                            { titleKey: 'home.aesthetic.services.weather', icon: Zap, link: '/dashboard' }
                        ].map((item, idx) => (
                            <Link key={idx} to={user ? item.link : '/login'}
                                className="group relative h-48 bg-[#1a2e22]/90 border-r border-white/5 hover:bg-[#254130] transition duration-500 flex flex-col items-center justify-center p-6 backdrop-blur-sm cursor-pointer"
                            >
                                <item.icon className="text-[#4ade80] w-10 h-10 mb-4 group-hover:scale-110 transition duration-500" />
                                <span className="text-white font-serif text-xl tracking-wide group-hover:text-[#4ade80] transition-colors">{t(item.titleKey)}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;