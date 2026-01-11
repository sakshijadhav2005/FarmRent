import React from 'react';
import { MapPin, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../api';

/**
 * GOLDEN RATIO EQUIPMENT CARD
 * φ = 1.618 applied throughout:
 * - Image height: φ-based (10rem × 1.618 = 16.18rem aspect)
 * - Padding: φ multipliers
 * - Border radius: φ-based
 * - Typography: φ scale
 */

const EquipmentCard = ({ equipment }) => {
    return (
        <div className="equipment-card group" style={{ borderRadius: '1.618rem' }}>
            {/* Image Container - φ aspect ratio */}
            <div className="equipment-card-image relative" style={{ height: '10rem' }}>
                <img
                    src={getImageUrl(equipment.image)}
                    alt={equipment.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-phi"
                    style={{ transitionDuration: '685ms' }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-background via-transparent to-transparent"
                    style={{ opacity: '0.8' }}></div>

                {/* Rating Badge - φ positioning */}
                <div className="absolute badge badge-primary z-10 backdrop-blur-sm flex items-center"
                    style={{ top: '0.618rem', right: '0.618rem', gap: '0.236rem' }}>
                    <Star style={{ width: '0.618rem', height: '0.618rem' }} className="fill-current" />
                    <span className="font-bold">{equipment.rating || 4.5}</span>
                </div>

                {/* Category Badge */}
                {equipment.type && (
                    <div className="absolute bg-white/10 backdrop-blur-sm text-brand-text-light z-10"
                        style={{ top: '0.618rem', left: '0.618rem', padding: '0.236rem 0.618rem', borderRadius: '0.382rem', fontSize: '0.688rem', fontWeight: '600' }}>
                        {equipment.type}
                    </div>
                )}
            </div>

            {/* Content - φ padding */}
            <div style={{ padding: '1.272rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '0.618rem' }}>
                    <h3 className="font-display font-bold text-brand-text-light group-hover:text-brand-primary-light transition-phi"
                        style={{ fontSize: '1.272rem', marginBottom: '0.236rem' }}>
                        {equipment.name}
                    </h3>
                    <p className="text-brand-text-muted" style={{ fontSize: '0.875rem' }}>
                        {equipment.model}{equipment.year ? ` • ${equipment.year}` : ''}
                    </p>
                </div>

                {/* Location */}
                <div className="flex items-center text-brand-text-muted"
                    style={{ fontSize: '0.875rem', marginBottom: '1rem', gap: '0.236rem' }}>
                    <MapPin className="text-brand-primary" style={{ width: '1rem', height: '1rem' }} />
                    <span className="truncate">{equipment.location || 'Location not specified'}</span>
                </div>

                {/* Footer - φ spacing */}
                <div className="flex items-center justify-between border-t border-white/5"
                    style={{ paddingTop: '1rem' }}>
                    {/* Price */}
                    <div className="flex items-baseline" style={{ gap: '0.146rem' }}>
                        <span className="font-display font-bold text-brand-secondary-light"
                            style={{ fontSize: '1.618rem' }}>
                            ₹{equipment.pricePerHour || equipment.price}
                        </span>
                        <span className="text-brand-text-muted" style={{ fontSize: '0.75rem' }}>/hour</span>
                    </div>

                    {/* Book Button */}
                    <Link to={`/equipment/${equipment._id || equipment.id}`}
                        className="relative inline-flex items-center font-semibold overflow-hidden group/btn"
                        style={{ padding: '0.618rem 1.272rem', borderRadius: '0.618rem', gap: '0.382rem' }}>
                        {/* Button Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-primary-dark transition-phi group-hover/btn:shadow-glow-primary"></div>

                        {/* Button Content */}
                        <span className="relative z-10 text-white" style={{ fontSize: '0.875rem' }}>Book Now</span>
                        <ArrowRight className="relative z-10 text-white group-hover/btn:translate-x-1 transition-phi"
                            style={{ width: '1rem', height: '1rem' }} />
                    </Link>
                </div>
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-phi"
                style={{ borderRadius: '1.618rem' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/10 via-transparent to-transparent"
                    style={{ borderRadius: '1.618rem' }}></div>
            </div>
        </div>
    );
};

export default EquipmentCard;
