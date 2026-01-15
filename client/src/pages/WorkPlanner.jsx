/**
 * Work Planner Page
 * =================
 * 
 * PURPOSE: Weather-based farming activity planning and suitability analysis.
 * 
 * THIS IS A SEPARATE FEATURE FROM VOICE ASSISTANT:
 * - Work Planner: Analyzes weather conditions for specific farming activities
 *                 (harvesting, ploughing, spraying, sowing, irrigation)
 * - Voice Assistant: AI-powered conversational interface for general farming queries
 * 
 * FEATURES:
 * - Select farming activity type (harvesting, ploughing, spraying, etc.)
 * - Enter location and date for planning
 * - Get weather-based suitability score (0-100%)
 * - Receive AI recommendations, warnings, and suggestions
 * - Text-to-speech for results (supports Hindi, Marathi, English)
 * 
 * HOW IT WORKS:
 * 1. User selects an activity type
 * 2. User enters location and planned date
 * 3. System fetches weather data for that location/date
 * 4. AI analyzes weather suitability for the selected activity
 * 5. Results are displayed with score, recommendations, and warnings
 * 
 * ROUTE: /work-planner
 * 
 * @author FarmLink Development Team
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, CloudRain, Wind, Thermometer, Calendar, MapPin, CheckCircle2, AlertTriangle, Info, Volume2, VolumeX, Globe, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { getBookingRecommendation } from '../api';
import { useAuth } from '../context/AuthContext';

const WorkPlanner = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechEnabled, setSpeechEnabled] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const resultRef = useRef(null);

    // Get current language for speech synthesis
    // Helper function to map i18n language codes to speech synthesis locales
    // Matches 'mr' (Marathi), 'hi' (Hindi) to region-specific codes like 'mr-IN', 'hi-IN'
    const getCurrentLanguage = () => {
        const currentLang = i18n.language;
        if (currentLang.startsWith('mr')) return 'mr-IN'; // Marathi
        if (currentLang.startsWith('hi')) return 'hi-IN'; // Hindi
        return 'en-IN'; // English (default)
    };

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

    /**
     * PDF Generation Function
     * Uses html2pdf.js to capture the visual state of the results container (including Hindi/Marathi text)
     * and compiles it into a high-quality PDF.
     */
    // Download PDF function
    const downloadPDF = () => {
        const element = resultRef.current;
        if (!element) return;

        const filename = `FarmLink_Plan_${formData.location.replace(/\s+/g, '_')}_${formData.date}.pdf`;

        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0f172a', logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        setDownloading(true);
        html2pdf().set(opt).from(element).save()
            .then(() => setDownloading(false))
            .catch(err => {
                console.error('PDF generation error:', err);
                setDownloading(false);
            });
    };


    /**
     * Handle Form Submission
     * 1. Maps activity type to specific equipment
     * 2. Calls backend API with location, date, AND selected language
     * 3. Triggers speech synthesis if enabled
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            // Map general activity to specific equipment type for better AI context
            let equipmentType = 'General';
            if (formData.activityType === 'Harvesting') equipmentType = 'Harvester';
            if (formData.activityType === 'Ploughing') equipmentType = 'Tractor';
            if (formData.activityType === 'Spraying') equipmentType = 'Drone';

            const res = await getBookingRecommendation({
                location: formData.location,
                startDate: formData.date,
                endDate: formData.date,
                equipmentType,
                language: i18n.language // Pass current language
            });

            if (res.data.success) {
                setResult(res.data.data);

                // Auto-speak result if speech is enabled
                if (speechEnabled && res.data.data.recommendation) {
                    setTimeout(() => {
                        speakResult(res.data.data);
                    }, 1000);
                }
            }
        } catch (err) {
            console.error('Work Planner Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Speech synthesis functions with multi-language support
    const speakResult = (resultData) => {
        if (!speechEnabled || !window.speechSynthesis) return;

        // Stop any current speech
        window.speechSynthesis.cancel();

        const currentLang = getCurrentLanguage();
        let textToSpeak = '';

        // Get translated activity name
        const activityOption = activityOptions.find(opt => opt.value === formData.activityType);
        const translatedActivity = activityOption ? t(activityOption.labelKey) : formData.activityType;

        // Create language-specific speech text
        if (currentLang === 'mr-IN') {
            textToSpeak = `${formData.location} मध्ये ${translatedActivity} साठी योग्यता विश्लेषण. `;
            textToSpeak += `एकूण गुण: ${resultData.overallScore} टक्के. `;
            textToSpeak += `${resultData.suitability} परिस्थिती. `;
            textToSpeak += `${resultData.recommendation} `;

            if (resultData.warnings && resultData.warnings.length > 0) {
                textToSpeak += `चेतावणी: ${resultData.warnings.join('. ')} `;
            }

            if (resultData.suggestions && resultData.suggestions.length > 0) {
                textToSpeak += `सूचना: ${resultData.suggestions.join('. ')}`;
            }
        } else if (currentLang === 'hi-IN') {
            textToSpeak = `${formData.location} में ${translatedActivity} के लिए उपयुक्तता विश्लेषण. `;
            textToSpeak += `कुल अंक: ${resultData.overallScore} प्रतिशत. `;
            textToSpeak += `${resultData.suitability} स्थितियां. `;
            textToSpeak += `${resultData.recommendation} `;

            if (resultData.warnings && resultData.warnings.length > 0) {
                textToSpeak += `चेतावनी: ${resultData.warnings.join('. ')} `;
            }

            if (resultData.suggestions && resultData.suggestions.length > 0) {
                textToSpeak += `सुझाव: ${resultData.suggestions.join('. ')}`;
            }
        } else {
            // English (default)
            textToSpeak = `Suitability analysis for ${translatedActivity} in ${formData.location}. `;
            textToSpeak += `Overall score: ${resultData.overallScore} percent. `;
            textToSpeak += `${resultData.suitability} conditions. `;
            textToSpeak += `${resultData.recommendation} `;

            if (resultData.warnings && resultData.warnings.length > 0) {
                textToSpeak += `Warnings: ${resultData.warnings.join('. ')} `;
            }

            if (resultData.suggestions && resultData.suggestions.length > 0) {
                textToSpeak += `Suggestions: ${resultData.suggestions.join('. ')}`;
            }
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = currentLang;
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Enhanced voice selection for Indian languages
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (currentLang === 'hi-IN') {
            // Prefer Hindi voices
            selectedVoice = voices.find(v =>
                v.lang === 'hi-IN' ||
                v.lang === 'hi' ||
                v.name.toLowerCase().includes('hindi')
            );
        } else if (currentLang === 'mr-IN') {
            // Prefer Marathi voices (fallback to Hindi if not available)
            selectedVoice = voices.find(v =>
                v.lang === 'mr-IN' ||
                v.lang === 'mr' ||
                v.name.toLowerCase().includes('marathi')
            ) || voices.find(v =>
                v.lang === 'hi-IN' ||
                v.lang === 'hi'
            );
        } else {
            // English voices
            selectedVoice = voices.find(v =>
                v.lang === 'en-IN' ||
                v.lang === 'en-US' ||
                v.lang.startsWith('en')
            );
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const toggleSpeech = () => {
        if (isSpeaking) {
            stopSpeaking();
        } else if (result) {
            speakResult(result);
        }
    };

    return (
        <div className="animate-in-up space-y-4">
            {/* Header with Language Selection */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-4 md:p-6 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="relative z-10">
                    {/* Top Row - Title and Speech Controls */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-400/20 rounded-full flex items-center justify-center">
                                <Sun className="h-5 w-5 text-yellow-300 animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-display font-bold text-white">{t('workPlanner.title')}</h1>
                                <p className="text-blue-100 text-sm">{t('workPlanner.subtitle')}</p>
                            </div>
                        </div>

                        {/* Speech & Result Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSpeechEnabled(!speechEnabled)}
                                className={`p-2 rounded-full transition-all ${speechEnabled
                                    ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                    }`}
                                title={speechEnabled ? 'Speech Enabled' : 'Speech Disabled'}
                            >
                                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            </button>

                            {result && (
                                <button
                                    onClick={toggleSpeech}
                                    disabled={!speechEnabled}
                                    className={`p-2 rounded-full transition-all ${isSpeaking
                                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                        : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={isSpeaking ? 'Stop Speaking' : 'Speak Result'}
                                >
                                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Language Selection Bar - Separate Section */}
            <div className="glass-card p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">{t('workPlanner.selectLanguage') || 'Select Language'}</span>
                </div>
                <div className="flex items-center gap-2">
                    {[
                        { code: 'en', label: 'English', flag: '🇬🇧' },
                        { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
                        { code: 'mr', label: 'मराठी', flag: '🚩' }
                    ].map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => i18n.changeLanguage(lang.code)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${i18n.language.startsWith(lang.code)
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                                : 'bg-white/5 text-brand-text-muted hover:bg-white/10 border border-white/10'
                                }`}
                        >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity Selection - Compact Horizontal at Top */}
            <div className="glass-card p-4 border-t-4 border-blue-500 mb-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    {/* Activity Buttons - Horizontal */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-brand-text-light mb-2">{t('workPlanner.farmingActivity')}</label>
                        <div className="flex flex-wrap gap-2">
                            {activityOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, activityType: option.value })}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${formData.activityType === option.value
                                        ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                                        : 'bg-slate-800/50 border-white/5 text-brand-text hover:bg-slate-800 hover:border-white/20'
                                        }`}
                                >
                                    <span className="text-lg">{option.icon}</span>
                                    <span className="font-medium text-xs">{t(option.labelKey)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location, Date, and Buttons - Right Aligned */}
                    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 w-full md:w-auto">
                        <div className="flex-1 md:w-[180px]">
                            <label className="block text-xs font-medium text-brand-text-muted mb-1">{t('workPlanner.location')}</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-text-muted" />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 text-xs"
                                    placeholder="e.g. Pune"
                                    required
                                />
                            </div>
                        </div>
                        <div className="w-[140px]">
                            <label className="block text-xs font-medium text-brand-text-muted mb-1">{t('workPlanner.plannedDate')}</label>
                            <input
                                type="date"
                                value={formData.date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white text-xs"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading || !formData.location}
                                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 h-[34px]"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t('workPlanner.analyzing') || 'Analyzing...'}
                                    </>
                                ) : (
                                    <>{t('workPlanner.analyze') || 'Analyze'} ✨</>
                                )}
                            </button>
                            {result && (
                                <button
                                    type="button"
                                    onClick={downloadPDF}
                                    disabled={downloading}
                                    className="px-3 py-2 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-500 text-white shadow-lg flex items-center gap-1.5 disabled:opacity-50 h-[34px]"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    {downloading ? '...' : 'PDF'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Main Content Layout */}
            {/* Show placeholder when no results */}
            {!result && !loading && (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-white/10 bg-slate-900/30 min-h-[300px]">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-float">
                        <CloudRain className="w-12 h-12 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">{t('workPlanner.readyTitle')}</h3>
                    <p className="text-brand-text-muted max-w-lg text-lg">
                        {t('workPlanner.readyDesc')}
                    </p>
                </div>
            )}

            {/* Loading State - Full Width */}
            {loading && (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl border border-white/10 bg-slate-900/30">
                    <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-blue-300 animate-pulse text-lg">{t('workPlanner.analyzing') || 'Analyzing Suitability...'}</p>
                    <p className="text-brand-text-muted text-sm mt-2">{t('workPlanner.pleaseWait') || 'This may take a moment...'}</p>
                </div>
            )}

            {/* Results Section - Full Width */}
            {result && (
                <div ref={resultRef} className="space-y-4 animate-in-up">
                    {/* Main Verdict Card - Full Width */}

                    {/* Main Verdict Card - Full Width */}
                    <div className={`p-4 md:p-6 rounded-2xl border flex flex-col md:flex-row items-center gap-4 md:gap-6 ${result.overallScore >= 80 ? 'bg-green-500/10 border-green-500/30' :
                        result.overallScore >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' :
                            'bg-red-500/10 border-red-500/30'
                        }`}>
                        <div className="relative">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-black/20" />
                                <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent"
                                    strokeDasharray={276}
                                    strokeDashoffset={276 - (276 * result.overallScore) / 100}
                                    className={`${result.overallScore >= 80 ? 'text-green-500' :
                                        result.overallScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                                        } transition-all duration-1000 ease-out`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white">{result.overallScore}%</span>
                                <span className="text-xs uppercase font-bold tracking-wider opacity-70">Fit</span>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                <h2 className="text-xl font-bold text-white">{result.suitability} {t('workPlanner.conditions') || 'Conditions'}</h2>
                                {result.overallScore >= 80 ?
                                    <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                }
                            </div>
                            <p className="text-white/90 mb-3">{result.recommendation}</p>

                            {/* Speech Button */}
                            {speechEnabled && (
                                <button
                                    onClick={toggleSpeech}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSpeaking
                                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                        : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                                        }`}
                                >
                                    {isSpeaking ? (
                                        <>
                                            <VolumeX className="w-3 h-3 inline mr-1" />
                                            {t('workPlanner.stopSpeaking') || 'Stop Speaking'}
                                        </>
                                    ) : (
                                        <>
                                            <Volume2 className="w-3 h-3 inline mr-1" />
                                            {t('workPlanner.speakResult') || 'Speak Result'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Two Column Layout for All Sections - Compact */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {/* LEFT COLUMN */}
                        <div className="space-y-3">
                            {/* Potential Risks */}
                            <div className="glass-card p-3 border-l-4 border-red-500">
                                <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    {t('workPlanner.potentialRisks')}
                                </h3>
                                {result.warnings && result.warnings.length > 0 ? (
                                    <ul className="space-y-1.5">
                                        {result.warnings.map((warn, i) => (
                                            <li key={i} className="flex gap-2 text-red-200 bg-red-500/10 p-2 rounded-lg text-sm">
                                                <span className="mt-0.5">⚠️</span>
                                                {warn}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-sm">{t('workPlanner.noRisks')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Step-by-Step Guide */}
                            {result.stepByStepGuide && result.stepByStepGuide.length > 0 && (
                                <div className="glass-card p-3 border-l-4 border-green-500">
                                    <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                                        📋 {t('workPlanner.stepByStep') || 'Step-by-Step Guide'}
                                    </h3>
                                    <ol className="space-y-1.5">
                                        {result.stepByStepGuide.map((step, i) => (
                                            <li key={i} className="flex gap-3 text-green-200 bg-green-500/10 p-2 rounded-lg text-sm">
                                                <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                    {i + 1}
                                                </span>
                                                <span className="text-xs">{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* Optimal Timing */}
                            {result.optimalTiming && (
                                <div className="glass-card p-3 border-l-4 border-yellow-500">
                                    <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                                        ⏰ {t('workPlanner.optimalTiming') || 'Optimal Timing'}
                                    </h3>
                                    <div className="space-y-1.5">
                                        <div className="bg-yellow-500/10 p-2.5 rounded-lg">
                                            <p className="text-yellow-300 font-semibold text-xs uppercase mb-1">✅ Best Hours</p>
                                            <p className="text-white text-base font-bold">{result.optimalTiming.bestHours}</p>
                                            <p className="text-yellow-200 text-xs mt-0.5">{result.optimalTiming.reason}</p>
                                        </div>
                                        <div className="bg-red-500/10 p-2.5 rounded-lg">
                                            <p className="text-red-300 font-semibold text-xs uppercase mb-1">❌ Avoid</p>
                                            <p className="text-white text-sm">{result.optimalTiming.avoidHours}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Local Wisdom */}
                            {result.localWisdom && (
                                <div className="glass-card p-3 border-l-4 border-amber-500">
                                    <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                                        🌾 {t('workPlanner.localWisdom') || 'Local Farming Wisdom'}
                                    </h3>
                                    <div className="bg-amber-500/10 p-2.5 rounded-lg">
                                        <p className="text-amber-200 text-sm italic">"{result.localWisdom}"</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-3">
                            {/* AI Suggestions */}
                            <div className="glass-card p-3 border-l-4 border-blue-500">
                                <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-blue-500" />
                                    {t('workPlanner.aiSuggestions')}
                                </h3>
                                {result.suggestions && result.suggestions.length > 0 ? (
                                    <ul className="space-y-1.5">
                                        {result.suggestions.map((sugg, i) => (
                                            <li key={i} className="flex gap-2 text-blue-200 bg-blue-500/10 p-2 rounded-lg text-sm">
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

                            {/* Equipment Tips */}
                            {result.equipmentTips && result.equipmentTips.length > 0 && (
                                <div className="glass-card p-3 border-l-4 border-purple-500">
                                    <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                                        🔧 {t('workPlanner.equipmentTips') || 'Equipment Tips'}
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {result.equipmentTips.map((tip, i) => (
                                            <li key={i} className="flex gap-2 text-purple-200 bg-purple-500/10 p-2 rounded-lg text-sm">
                                                <span className="mt-0.5">⚙️</span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Expected Outcome */}
                            {result.expectedOutcome && (
                                <div className="glass-card p-3 border-l-4 border-emerald-500">
                                    <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                                        🎯 {t('workPlanner.expectedOutcome') || 'Expected Outcome'}
                                    </h3>
                                    <div className="bg-emerald-500/10 p-2.5 rounded-lg">
                                        <p className="text-emerald-200 text-sm">{result.expectedOutcome}</p>
                                    </div>
                                </div>
                            )}

                            {/* Weather Impact */}
                            {result.weatherImpact && (
                                <div className="glass-card p-3 border-l-4 border-cyan-500">
                                    <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                                        🌤️ {t('workPlanner.weatherImpact') || 'Weather Impact Analysis'}
                                    </h3>
                                    <div className="space-y-1.5">
                                        <div className="bg-cyan-500/10 p-2.5 rounded-lg">
                                            <p className="text-cyan-300 font-semibold text-xs mb-1">Current Conditions</p>
                                            <p className="text-white text-sm">{result.weatherImpact.currentConditions}</p>
                                        </div>
                                        <div className="bg-cyan-500/10 p-2.5 rounded-lg">
                                            <p className="text-cyan-300 font-semibold text-xs mb-1">Preparation</p>
                                            <p className="text-white text-sm">{result.weatherImpact.preparation}</p>
                                        </div>
                                        <div className="bg-cyan-500/10 p-2.5 rounded-lg">
                                            <p className="text-cyan-300 font-semibold text-xs mb-1">Contingency Plan</p>
                                            <p className="text-white text-sm">{result.weatherImpact.contingency}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Market Insights - Full Width */}
                    {result.marketInsights && result.marketInsights.length > 0 && (
                        <div className="glass-card p-4 border-l-4 border-indigo-500">
                            <h3 className="text-md font-bold text-white mb-3 flex items-center gap-2">
                                📊 {t('workPlanner.marketInsights') || 'Market Insights'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {result.marketInsights.map((insight, i) => (
                                    <div key={i} className="flex gap-2 text-indigo-200 bg-indigo-500/10 p-2 rounded-lg text-sm">
                                        <span className="mt-0.5">📈</span>
                                        {insight}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 7-Day Weather Forecast Section */}
                    {result.forecast && result.forecast.length > 0 && (
                        <div className="glass-card p-4 border-l-4 border-sky-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">
                                    📅 {t('workPlanner.weeklyForecast') || '7-Day Weather Forecast'}
                                </h3>
                                {result.summary && (
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-green-400">
                                            ✅ {result.summary.idealDaysCount} {t('workPlanner.idealDays') || 'Ideal Days'}
                                        </span>
                                        <span className="text-red-400">
                                            🌧️ {result.summary.rainyDaysCount} {t('workPlanner.rainyDays') || 'Rainy Days'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Horizontal Scrollable Forecast Cards */}
                            <div className="overflow-x-auto pb-2">
                                <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                                    {result.forecast.map((day, index) => (
                                        <div
                                            key={index}
                                            className={`flex-shrink-0 w-32 p-3 rounded-xl border transition-all ${day.farming?.score >= 4
                                                ? 'bg-green-500/10 border-green-500/30'
                                                : day.farming?.score >= 2
                                                    ? 'bg-yellow-500/10 border-yellow-500/30'
                                                    : 'bg-red-500/10 border-red-500/30'
                                                }`}
                                        >
                                            {/* Day Header */}
                                            <div className="text-center mb-2">
                                                <p className="text-white font-bold text-sm">{day.dateInfo?.dayName}</p>
                                                <p className="text-brand-text-muted text-xs">{day.dateInfo?.month} {day.dateInfo?.dayNumber}</p>
                                            </div>

                                            {/* Weather Icon */}
                                            <div className="flex justify-center mb-2">
                                                {day.weather?.icon ? (
                                                    <img
                                                        src={day.weather.icon}
                                                        alt={day.weather?.description || 'weather'}
                                                        className="w-12 h-12"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                                        <CloudRain className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Temperature */}
                                            <div className="text-center mb-2">
                                                <p className="text-white font-bold text-lg">{day.temperature?.avg}°C</p>
                                                <p className="text-brand-text-muted text-xs">
                                                    {day.temperature?.min}° - {day.temperature?.max}°
                                                </p>
                                            </div>

                                            {/* Weather Details */}
                                            <div className="space-y-1 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-brand-text-muted flex items-center gap-1">
                                                        💧
                                                    </span>
                                                    <span className="text-white">{day.humidity}%</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-brand-text-muted flex items-center gap-1">
                                                        💨
                                                    </span>
                                                    <span className="text-white">{day.windSpeed} km/h</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-brand-text-muted flex items-center gap-1">
                                                        🌧️
                                                    </span>
                                                    <span className="text-white">{day.precipitation}%</span>
                                                </div>
                                            </div>

                                            {/* Farming Suitability Badge */}
                                            <div className={`mt-2 py-1 px-2 rounded-full text-center text-xs font-semibold ${day.farming?.rating === 'IDEAL' ? 'bg-green-500/30 text-green-300' :
                                                day.farming?.rating === 'GOOD' ? 'bg-green-500/20 text-green-400' :
                                                    day.farming?.rating === 'FAIR' ? 'bg-yellow-500/20 text-yellow-300' :
                                                        'bg-red-500/20 text-red-300'
                                                }`}>
                                                {day.farming?.rating || 'N/A'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Best Days Summary */}
                            {result.summary?.bestDays && result.summary.bestDays.length > 0 && (
                                <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <p className="text-green-300 text-sm font-medium flex items-center gap-2">
                                        ⭐ {t('workPlanner.bestDays') || 'Best Days for Work'}:
                                        <span className="text-white font-bold">
                                            {result.summary.bestDays.join(', ')}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkPlanner;