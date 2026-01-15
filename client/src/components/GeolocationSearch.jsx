import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Loader2, AlertCircle, Tractor, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:5001/api';

/**
 * Geolocation Search Component
 * Find nearby equipment using GPS location
 */
const GeolocationSearch = ({ onEquipmentSelect }) => {
    const { t } = useTranslation();
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [equipment, setEquipment] = useState([]);
    const [radius, setRadius] = useState(25); // km
    const [searchQuery, setSearchQuery] = useState('');
    const [manualLocation, setManualLocation] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [equipmentType, setEquipmentType] = useState('all');

    const equipmentTypes = [
        { value: 'all', label: t('common.all', 'All') },
        { value: 'tractor', label: t('equipment.types.tractor', 'Tractor') },
        { value: 'harvester', label: t('equipment.types.harvester', 'Harvester') },
        { value: 'drone', label: t('equipment.types.drone', 'Drone') },
        { value: 'tiller', label: t('equipment.types.tiller', 'Tiller') },
        { value: 'sprayer', label: t('equipment.types.sprayer', 'Sprayer') },
        { value: 'seeder', label: t('equipment.types.seeder', 'Seeder') }
    ];

    // Get user's current location
    const getCurrentLocation = () => {
        setLoading(true);
        setError('');

        if (!navigator.geolocation) {
            setError(t('geolocation.notSupported', 'Geolocation is not supported by your browser'));
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                setLoading(false);
                // Auto-search when location is obtained
                searchNearbyEquipment(latitude, longitude);
            },
            (err) => {
                console.error('Geolocation error:', err);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError(t('geolocation.permissionDenied', 'Location permission denied. Please enable location access.'));
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError(t('geolocation.positionUnavailable', 'Location information unavailable.'));
                        break;
                    case err.TIMEOUT:
                        setError(t('geolocation.timeout', 'Location request timed out.'));
                        break;
                    default:
                        setError(t('geolocation.error', 'An error occurred while getting your location.'));
                }
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    };

    // Search for equipment near location
    const searchNearbyEquipment = async (lat, lng) => {
        setLoading(true);
        try {
            let url = `${API_BASE}/equipment?lat=${lat}&lng=${lng}&radius=${radius}`;
            if (equipmentType !== 'all') {
                url += `&type=${equipmentType}`;
            }
            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                // Sort by distance
                const sorted = (data.data || []).sort((a, b) =>
                    (a.distance || 0) - (b.distance || 0)
                );
                setEquipment(sorted);
            } else {
                setEquipment([]);
            }
        } catch (err) {
            console.error('Search error:', err);
            setError(t('geolocation.searchError', 'Failed to search for equipment'));
        } finally {
            setLoading(false);
        }
    };

    // Search by city/location name
    const searchByLocationName = async () => {
        if (!manualLocation.trim()) return;

        setLoading(true);
        setError('');

        try {
            // Use a geocoding service (OpenStreetMap Nominatim)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
                searchNearbyEquipment(parseFloat(lat), parseFloat(lon));
            } else {
                setError(t('geolocation.locationNotFound', 'Location not found. Try a different search.'));
                setLoading(false);
            }
        } catch (err) {
            console.error('Geocoding error:', err);
            setError(t('geolocation.geocodeError', 'Failed to find location'));
            setLoading(false);
        }
    };

    // Handle search when pressing Enter
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            searchByLocationName();
        }
    };

    // Re-search when filters change
    useEffect(() => {
        if (location) {
            searchNearbyEquipment(location.lat, location.lng);
        }
    }, [radius, equipmentType]);

    const calculateDistance = (distance) => {
        if (!distance) return t('geolocation.unknownDistance', 'Unknown');
        if (distance < 1) return `${Math.round(distance * 1000)} m`;
        return `${distance.toFixed(1)} km`;
    };

    return (
        <div className="glass-card rounded-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-brand-text-light">
                            {t('geolocation.title', 'Find Nearby Equipment')}
                        </h2>
                        <p className="text-sm text-brand-text-muted">
                            {t('geolocation.subtitle', 'Discover equipment available near you')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-brand-primary text-white' : 'bg-white/10 text-brand-text-light hover:bg-white/20'}`}
                >
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            {/* Location Input */}
            <div className="space-y-4">
                {/* GPS Button */}
                <button
                    onClick={getCurrentLocation}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-semibold hover:shadow-glow-primary transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Navigation className="w-5 h-5" />
                    )}
                    {t('geolocation.useMyLocation', 'Use My Current Location')}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-brand-text-muted text-sm">{t('common.or', 'or')}</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {/* Manual Location Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                    <input
                        type="text"
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('geolocation.enterLocation', 'Enter city or village name...')}
                        className="w-full pl-12 pr-24 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-brand-text-muted focus:outline-none focus:border-brand-primary"
                    />
                    <button
                        onClick={searchByLocationName}
                        disabled={loading || !manualLocation.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        {t('common.search', 'Search')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="p-4 bg-white/5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-brand-text-light">{t('common.filter', 'Filters')}</h3>
                        <button onClick={() => setShowFilters(false)} className="text-brand-text-muted hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Radius Slider */}
                    <div>
                        <label className="text-sm text-brand-text-muted block mb-2">
                            {t('geolocation.radius', 'Search Radius')}: <span className="text-brand-primary font-semibold">{radius} km</span>
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="100"
                            value={radius}
                            onChange={(e) => setRadius(parseInt(e.target.value))}
                            className="w-full accent-brand-primary"
                        />
                    </div>

                    {/* Equipment Type */}
                    <div>
                        <label className="text-sm text-brand-text-muted block mb-2">
                            {t('equipment.type', 'Equipment Type')}
                        </label>
                        <select
                            value={equipmentType}
                            onChange={(e) => setEquipmentType(e.target.value)}
                            className="w-full px-4 py-2 bg-brand-surface border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-primary"
                        >
                            {equipmentTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Location Status */}
            {location && (
                <div className="flex items-center gap-2 p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-xl">
                    <MapPin className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm text-brand-text-light">
                        {t('geolocation.searchingNear', 'Searching near')}: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                </div>
            )}

            {/* Results */}
            {equipment.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-brand-text-light">
                        {t('geolocation.results', 'Found')} {equipment.length} {t('geolocation.equipmentNearby', 'equipment nearby')}
                    </h3>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {equipment.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => onEquipmentSelect && onEquipmentSelect(item)}
                                className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors"
                            >
                                {/* Image */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.images && item.images.length > 0 ? (
                                        <img
                                            src={item.images[0]}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-brand-surface flex items-center justify-center">
                                            <Tractor className="w-8 h-8 text-brand-primary" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-brand-text-light truncate">{item.name}</h4>
                                    <p className="text-sm text-brand-text-muted truncate">{item.type}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-brand-primary font-bold">₹{item.pricePerHour}/hr</span>
                                        {item.distance && (
                                            <span className="text-xs text-brand-text-muted flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {calculateDistance(item.distance)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Availability Badge */}
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${item.availability
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {item.availability ? t('common.available', 'Available') : t('common.booked', 'Booked')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Results */}
            {location && equipment.length === 0 && !loading && !error && (
                <div className="text-center py-8">
                    <Tractor className="w-12 h-12 mx-auto mb-3 text-brand-text-muted opacity-50" />
                    <p className="text-brand-text-muted">
                        {t('geolocation.noResults', 'No equipment found in this area. Try increasing the search radius.')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default GeolocationSearch;
