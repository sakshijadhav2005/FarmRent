import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Search, MapPin, Star, SlidersHorizontal } from 'lucide-react';

/**
 * Advanced Search Filters Component
 * Collapsible filter panel for equipment search
 */
const SearchFilters = ({ filters, onChange, onClear, equipmentTypes = [] }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters || {
        search: '',
        type: '',
        minPrice: '',
        maxPrice: '',
        location: '',
        minRating: '',
        available: true,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
    };

    const handleApply = () => {
        onChange(localFilters);
    };

    const handleClear = () => {
        const clearedFilters = {
            search: '',
            type: '',
            minPrice: '',
            maxPrice: '',
            location: '',
            minRating: '',
            available: true,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };
        setLocalFilters(clearedFilters);
        onClear?.();
    };

    const hasActiveFilters = () => {
        return localFilters.type || localFilters.minPrice || localFilters.maxPrice ||
            localFilters.location || localFilters.minRating;
    };

    const defaultTypes = ['Tractor', 'Harvester', 'Drone', 'Tiller', 'Other'];
    const types = equipmentTypes.length > 0 ? equipmentTypes : defaultTypes;

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            {/* Search Bar - Always Visible */}
            <div className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                        <input
                            type="text"
                            value={localFilters.search}
                            onChange={(e) => handleChange('search', e.target.value)}
                            placeholder="Search equipment..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-brand-text-light placeholder-brand-text-muted focus:outline-none focus:border-brand-primary"
                        />
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${hasActiveFilters()
                                ? 'bg-brand-primary text-white'
                                : 'bg-white/10 text-brand-text-light hover:bg-white/15'
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                        {hasActiveFilters() && (
                            <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                                {[localFilters.type, localFilters.location, localFilters.minPrice, localFilters.minRating].filter(Boolean).length}
                            </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl font-medium transition-colors"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="border-t border-white/10 p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Equipment Type */}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                                Equipment Type
                            </label>
                            <select
                                value={localFilters.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-brand-text-light focus:outline-none focus:border-brand-primary"
                            >
                                <option value="">All Types</option>
                                {types.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                                Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                                <input
                                    type="text"
                                    value={localFilters.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    placeholder="Enter city..."
                                    className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-brand-text-light placeholder-brand-text-muted focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                        </div>

                        {/* Price Range */}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                                Price Range (₹/hr)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={localFilters.minPrice}
                                    onChange={(e) => handleChange('minPrice', e.target.value)}
                                    placeholder="Min"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-brand-text-light placeholder-brand-text-muted focus:outline-none focus:border-brand-primary"
                                />
                                <span className="text-brand-text-muted">-</span>
                                <input
                                    type="number"
                                    value={localFilters.maxPrice}
                                    onChange={(e) => handleChange('maxPrice', e.target.value)}
                                    placeholder="Max"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-brand-text-light placeholder-brand-text-muted focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                        </div>

                        {/* Minimum Rating */}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                                Minimum Rating
                            </label>
                            <select
                                value={localFilters.minRating}
                                onChange={(e) => handleChange('minRating', e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-brand-text-light focus:outline-none focus:border-brand-primary"
                            >
                                <option value="">Any Rating</option>
                                <option value="4">4+ Stars</option>
                                <option value="3">3+ Stars</option>
                                <option value="2">2+ Stars</option>
                            </select>
                        </div>
                    </div>

                    {/* Sort & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-brand-text-muted">Sort by:</label>
                            <select
                                value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
                                onChange={(e) => {
                                    const [sortBy, sortOrder] = e.target.value.split('-');
                                    handleChange('sortBy', sortBy);
                                    handleChange('sortOrder', sortOrder);
                                }}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-brand-text-light text-sm focus:outline-none focus:border-brand-primary"
                            >
                                <option value="createdAt-desc">Newest First</option>
                                <option value="createdAt-asc">Oldest First</option>
                                <option value="pricePerHour-asc">Price: Low to High</option>
                                <option value="pricePerHour-desc">Price: High to Low</option>
                                <option value="avgRating-desc">Highest Rated</option>
                            </select>
                        </div>

                        <button
                            onClick={handleClear}
                            className="text-sm text-brand-text-muted hover:text-red-400 flex items-center gap-1 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchFilters;
