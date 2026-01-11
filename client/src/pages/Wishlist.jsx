import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, MapPin, Star, Calendar, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getWishlist, removeFromWishlist, getImageUrl } from '../api';
import { useAuth } from '../context/AuthContext';

/**
 * Wishlist Page - Golden Ratio Design
 * Displays user's saved equipment
 */
const Wishlist = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState(null);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const response = await getWishlist();
            if (response.data?.success) {
                setItems(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (equipmentId) => {
        setRemoving(equipmentId);
        try {
            await removeFromWishlist(equipmentId);
            setItems(prev => prev.filter(item => item.equipment._id !== equipmentId));
        } catch (error) {
            console.error('Failed to remove from wishlist:', error);
        } finally {
            setRemoving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
                <Loader className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.618rem' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display font-bold text-brand-text-light" style={{ fontSize: '2.058rem', marginBottom: '0.382rem' }}>
                        {t('wishlist.title')}
                    </h1>
                    <p className="text-brand-text-muted">
                        {items.length} {t('nav.equipment')}
                    </p>
                </div>
                <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            </div>

            {/* Wishlist Grid */}
            {items.length === 0 ? (
                <div className="text-center py-16 glass-card" style={{ borderRadius: '1.618rem' }}>
                    <Heart className="w-16 h-16 text-brand-text-muted mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-brand-text-light mb-2">{t('wishlist.empty')}</h3>
                    <p className="text-brand-text-muted mb-6">
                        {t('wishlist.emptyDesc')}
                    </p>
                    <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
                        {t('wishlist.browse')}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1.618rem' }}>
                    {items.map((item) => {
                        const eq = item.equipment;
                        if (!eq) return null;

                        return (
                            <div key={item._id} className="equipment-card group relative">
                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemove(eq._id)}
                                    disabled={removing === eq._id}
                                    className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-red-500 backdrop-blur-sm rounded-full transition-colors"
                                    title="Remove from wishlist"
                                >
                                    {removing === eq._id ? (
                                        <Loader className="w-4 h-4 text-white animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 text-white" />
                                    )}
                                </button>

                                <Link to={`/equipment/${eq._id}`}>
                                    {/* Image */}
                                    <div className="equipment-card-image">
                                        <img
                                            src={getImageUrl(eq.image)}
                                            alt={eq.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                            style={{ transitionDuration: '685ms' }}
                                        />
                                        {/* Rating Badge */}
                                        {eq.avgRating > 0 && (
                                            <div className="absolute badge badge-primary z-10 backdrop-blur-sm"
                                                style={{ top: '0.618rem', left: '0.618rem' }}>
                                                <Star className="w-3 h-3 fill-current mr-1" />
                                                {eq.avgRating?.toFixed(1)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '1rem' }}>
                                        <h3 className="font-display font-bold text-brand-text-light"
                                            style={{ fontSize: '1.125rem', marginBottom: '0.236rem' }}>
                                            {eq.name}
                                        </h3>
                                        <p className="text-brand-text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.382rem' }}>
                                            {eq.model} {eq.year && `• ${eq.year}`}
                                        </p>

                                        <div className="flex items-center text-brand-text-muted"
                                            style={{ fontSize: '0.875rem', marginBottom: '0.618rem' }}>
                                            <MapPin className="w-4 h-4 mr-1" />
                                            {eq.location || 'Location not specified'}
                                        </div>

                                        <div className="flex items-center justify-between border-t border-white/5"
                                            style={{ paddingTop: '0.618rem' }}>
                                            <div>
                                                <span className="font-bold text-brand-secondary-light" style={{ fontSize: '1.618rem' }}>
                                                    ₹{eq.pricePerHour || eq.price}
                                                </span>
                                                <span className="text-brand-text-muted" style={{ fontSize: '0.75rem' }}>{t('common.perHour')}</span>
                                            </div>
                                            <span className={`badge ${eq.available ? 'badge-primary' : 'badge-warning'}`}>
                                                {eq.available ? t('common.available') : t('common.booked')}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Saved On Info */}
            {items.length > 0 && (
                <div className="text-center text-brand-text-muted text-sm">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    Items are saved for as long as they're available on the platform
                </div>
            )}
        </div>
    );
};

export default Wishlist;
