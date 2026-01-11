
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, CloudRain, Wind, Thermometer, Calendar, MapPin, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import axios, { getBookingRecommendation } from '../api';
import { useAuth } from '../context/AuthContext';

const WorkPlanner = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const [formData, setFormData] = useState({
        activityType: 'Harvesting',
        location: user?.location || '',
        date: new Date().toISOString().split('T')[0],
    });

    const activityOptions = [
        { value: 'Harvesting', labelKey: 'workPlanner.activities.harvesting', icon: '🌾' },
        { value: 'Spraying', labelKey: 'workPlanner.activities.spraying', icon: '🚿' },
        { value: 'Sowing', labelKey: 'workPlanner.activities.sowing', icon: '🌱' },
        { value: 'Ploughing', labelKey: 'workPlanner.activities.ploughing', icon: '🚜' },
        { value: 'Irrigation', labelKey: 'workPlanner.activities.irrigation', icon: '💧' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            let equipmentType = 'General';
            if (formData.activityType === 'Harvesting') equipmentType = 'Harvester';
            if (formData.activityType === 'Ploughing') equipmentType = 'Tractor';
            if (formData.activityType === 'Spraying') equipmentType = 'Drone';

            const res = await getBookingRecommendation({
                location: formData.location,
                startDate: formData.date,
                endDate: formData.date,
                equipmentType
            });

            if (res.data.success) {
                setResult(res.data.data);
            }
        } catch (err) {
            console.error('Work Planner Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in-up space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Sun className="h-8 w-8 text-yellow-300 animate-pulse" />
                        <h1 className="text-3xl font-display font-bold text-white">{t('workPlanner.title')}</h1>
                    </div>
                    <p className="text-blue-100 max-w-xl text-lg">
                        {t('workPlanner.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Input Form */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card p-6 border-t-4 border-blue-500">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            {t('workPlanner.planActivity')}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-light mb-1">{t('workPlanner.farmingActivity')}</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {activityOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, activityType: option.value })}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${formData.activityType === option.value
                                                ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                                                : 'bg-slate-800/50 border-white/5 text-brand-text hover:bg-slate-800 hover:border-white/20'
                                                }`}
                                        >
                                            <span className="text-2xl">{option.icon}</span>
                                            <span className="font-medium">{t(option.labelKey)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-light mb-1">{t('workPlanner.location')}</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-brand-text-muted" />
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
                                            placeholder="e.g. Pune"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-text-light mb-1">{t('workPlanner.plannedDate')}</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !formData.location}
                                className="w-full btn-primary py-3 mt-4 flex justify-center items-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t('workPlanner.analyzing')}
                                    </>
                                ) : (
                                    <>{t('workPlanner.analyze')} ✨</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-8">
                    {!result && !loading && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-white/10 bg-slate-900/30">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-float">
                                <CloudRain className="w-10 h-10 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{t('workPlanner.readyTitle')}</h3>
                            <p className="text-brand-text-muted max-w-md">
                                {t('workPlanner.readyDesc')}
                            </p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full flex flex-col items-center justify-center p-12">
                            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-blue-300 animate-pulse">{t('workPlanner.analyzing')}</p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6 animate-in-up">
                            {/* Main Verdict Card */}
                            <div className={`p-8 rounded-2xl border flex flex-col md:flex-row items-center gap-8 ${result.overallScore >= 80 ? 'bg-green-500/10 border-green-500/30' :
                                result.overallScore >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' :
                                    'bg-red-500/10 border-red-500/30'
                                }`}>
                                <div className="relative">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-black/20" />
                                        <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            strokeDasharray={377}
                                            strokeDashoffset={377 - (377 * result.overallScore) / 100}
                                            className={`${result.overallScore >= 80 ? 'text-green-500' :
                                                result.overallScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                                                } transition-all duration-1000 ease-out`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-white">{result.overallScore}%</span>
                                        <span className="text-xs uppercase font-bold tracking-wider opacity-70">Fit</span>
                                    </div>
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                        <h2 className="text-2xl font-bold text-white">{result.suitability} {t('weather.recommendation')}</h2>
                                        {result.overallScore >= 80 ?
                                            <CheckCircle2 className="w-6 h-6 text-green-500" /> :
                                            <AlertTriangle className="w-6 h-6 text-yellow-500" />
                                        }
                                    </div>
                                    <p className="text-lg text-white/90 mb-4">{result.recommendation}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Warnings Section */}
                                <div className="glass-card p-6 border-l-4 border-red-500">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        {t('workPlanner.potentialRisks')}
                                    </h3>
                                    {result.warnings.length > 0 ? (
                                        <ul className="space-y-3">
                                            {result.warnings.map((warn, i) => (
                                                <li key={i} className="flex gap-3 text-red-200 bg-red-500/10 p-3 rounded-lg text-sm">
                                                    <span className="mt-0.5">•</span>
                                                    {warn}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="flex items-center gap-2 text-green-400">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>{t('workPlanner.noRisks')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Suggestions Section */}
                                <div className="glass-card p-6 border-l-4 border-blue-500">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Info className="w-5 h-5 text-blue-500" />
                                        {t('workPlanner.aiSuggestions')}
                                    </h3>
                                    {result.suggestions.length > 0 ? (
                                        <ul className="space-y-3">
                                            {result.suggestions.map((sugg, i) => (
                                                <li key={i} className="flex gap-3 text-blue-200 bg-blue-500/10 p-3 rounded-lg text-sm">
                                                    <span className="mt-0.5">💡</span>
                                                    {sugg}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-brand-text-muted text-sm">
                                            {t('workPlanner.standardConditions')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Weather Details Strip */}
                            <div className="glass-card p-6 flex flex-wrap justify-around gap-6 text-center">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                                        <Thermometer className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <span className="text-xs text-brand-text-muted">{t('weather.title')}</span>
                                    <span className="text-lg font-bold text-white">28°C</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                                        <Wind className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <span className="text-xs text-brand-text-muted">Wind</span>
                                    <span className="text-lg font-bold text-white">12 km/h</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                                        <CloudRain className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <span className="text-xs text-brand-text-muted">Rain</span>
                                    <span className="text-lg font-bold text-white">10%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkPlanner;
