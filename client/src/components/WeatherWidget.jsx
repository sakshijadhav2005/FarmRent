import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, AlertTriangle, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import { getWeatherForecast } from '../api';

/**
 * Weather Widget Component
 * Displays 7-day weather forecast with farming recommendations
 * Uses Golden Ratio proportions for layout
 */

const WeatherWidget = ({ location, onDateSelect, selectedDate }) => {
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debouncedLocation, setDebouncedLocation] = useState(location);

    // Debounce location changes to avoid too many API calls while typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedLocation(location);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [location]);

    useEffect(() => {
        if (debouncedLocation && debouncedLocation.length >= 3) {
            fetchWeather();
        }
    }, [debouncedLocation]);

    const fetchWeather = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use debouncedLocation for the API call
            const searchLocation = debouncedLocation || 'India';
            const response = await getWeatherForecast(searchLocation);
            if (response.data.success) {
                setForecast(response.data.data);
                if (response.data.isDemo) {
                    console.log('Using demo weather data:', response.data.message);
                }
            } else {
                // API returned but said it failed - try to show demo data anyway
                console.warn('Weather API returned error, showing demo data');
                setForecast(response.data.data); // Usually contains fallback data
            }
        } catch (err) {
            console.error('Weather fetch error:', err);
            // Don't show error, just hide the widget or show minimal info
            // The widget will simply not render if forecast is null
            setError('Weather data unavailable for this location');
        } finally {
            setLoading(false);
        }
    };

    const getWeatherIcon = (main) => {
        switch (main?.toLowerCase()) {
            case 'clear':
            case 'sunny':
                return <Sun className="text-yellow-400" />;
            case 'clouds':
                return <Cloud className="text-gray-400" />;
            case 'rain':
            case 'drizzle':
                return <CloudRain className="text-blue-400" />;
            default:
                return <Cloud className="text-gray-400" />;
        }
    };

    const getRatingBadge = (rating, color) => {
        const colorClasses = {
            green: 'bg-green-500/20 text-green-400 border-green-500/30',
            yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            red: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colorClasses[color] || colorClasses.yellow}`}>
                {rating}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 text-brand-text-muted py-8">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Loading weather forecast...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-text-muted">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={fetchWeather}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 text-brand-primary-light" />
                    </button>
                </div>
            </div>
        );
    }

    if (!forecast) return null;

    return (
        <div className="glass-card rounded-xl overflow-hidden" style={{ padding: '1rem' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-accent to-brand-accent-dark flex items-center justify-center">
                        <Sun className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-brand-text-light text-sm">
                            Weather Forecast
                        </h3>
                        <p className="text-brand-text-muted text-xs">{forecast.location?.name || location}</p>
                    </div>
                </div>
                <button
                    onClick={fetchWeather}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Refresh forecast"
                >
                    <RefreshCw className="w-3.5 h-3.5 text-brand-text-muted hover:text-brand-primary-light" />
                </button>
            </div>

            {/* AI Recommendation */}
            {forecast.summary?.recommendation && (
                <div className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 border border-brand-primary/20 rounded-lg p-2.5 mb-3">
                    <p className="text-xs text-brand-text-light leading-relaxed">
                        {forecast.summary.recommendation}
                    </p>
                </div>
            )}

            {/* 7-Day Forecast Grid */}
            <div className="grid grid-cols-7 gap-1">
                {forecast.forecast?.slice(0, 7).map((day, index) => {
                    const isSelected = selectedDate &&
                        new Date(selectedDate).toDateString() === new Date(day.date * 1000).toDateString();
                    const isToday = index === 0;

                    return (
                        <button
                            key={index}
                            onClick={() => onDateSelect?.(new Date(day.date * 1000))}
                            className={`relative flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${isSelected
                                ? 'bg-brand-primary/30 border-2 border-brand-primary'
                                : 'hover:bg-white/10 border-2 border-transparent'
                                } ${day.farming?.score <= 1 ? 'opacity-60' : ''}`}
                        >
                            {/* Day Name */}
                            <span className={`text-[10px] font-semibold mb-1 ${isToday ? 'text-brand-primary-light' : 'text-brand-text-muted'
                                }`}>
                                {isToday ? 'Today' : day.dateInfo?.dayName}
                            </span>

                            {/* Weather Icon */}
                            <div className="w-8 h-8 flex items-center justify-center mb-1">
                                {day.weather?.icon ? (
                                    <img src={day.weather.icon} alt={day.weather.main} className="w-8 h-8" />
                                ) : (
                                    React.cloneElement(getWeatherIcon(day.weather?.main), { className: 'w-5 h-5' })
                                )}
                            </div>

                            {/* Temperature */}
                            <span className="text-xs font-bold text-brand-text-light mb-1">
                                {day.temperature?.max || day.temperature?.avg}°
                            </span>

                            {/* Farming Rating Badge */}
                            {getRatingBadge(day.farming?.rating, day.farming?.color)}

                            {/* Rain Indicator */}
                            {day.precipitation > 30 && (
                                <div className="absolute top-1 right-1">
                                    <Droplets className="w-2.5 h-2.5 text-blue-400" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Summary Stats */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-brand-text-muted">
                            {forecast.summary?.idealDaysCount || 0} ideal days
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-brand-text-muted">
                            {forecast.summary?.rainyDaysCount || 0} rainy
                        </span>
                    </div>
                </div>

                {forecast.isDemo && (
                    <span className="text-[10px] text-brand-text-dark bg-white/5 px-2 py-0.5 rounded">
                        Demo Data
                    </span>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-brand-text-muted">
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>Ideal</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span>Fair</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Avoid</span>
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;
