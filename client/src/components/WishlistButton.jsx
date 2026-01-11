import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { addToWishlist, removeFromWishlist, checkWishlist } from '../api';
import { useAuth } from '../context/AuthContext';

/**
 * Wishlist Button Component
 * Heart icon that toggles wishlist status
 */
const WishlistButton = ({ equipmentId, size = 'md', showText = false, className = '' }) => {
    const { user } = useAuth();
    const [inWishlist, setInWishlist] = useState(false);
    const [loading, setLoading] = useState(false);
    const [animating, setAnimating] = useState(false);

    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    useEffect(() => {
        if (user && equipmentId) {
            checkStatus();
        }
    }, [user, equipmentId]);

    const checkStatus = async () => {
        try {
            const response = await checkWishlist(equipmentId);
            if (response.data?.success) {
                setInWishlist(response.data.inWishlist);
            }
        } catch (error) {
            console.error('Failed to check wishlist status:', error);
        }
    };

    const handleToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            // Could redirect to login or show a message
            alert('Please login to add to wishlist');
            return;
        }

        if (loading) return;

        setLoading(true);
        setAnimating(true);

        try {
            if (inWishlist) {
                await removeFromWishlist(equipmentId);
                setInWishlist(false);
            } else {
                await addToWishlist(equipmentId);
                setInWishlist(true);
            }
        } catch (error) {
            console.error('Wishlist toggle failed:', error);
        } finally {
            setLoading(false);
            setTimeout(() => setAnimating(false), 300);
        }
    };

    if (!user) return null;

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex items-center gap-1.5 transition-all duration-200 ${inWishlist
                    ? 'text-red-500'
                    : 'text-brand-text-muted hover:text-red-400'
                } ${animating ? 'scale-125' : 'scale-100'} ${className}`}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
            <Heart
                className={`${sizes[size]} transition-all ${inWishlist ? 'fill-current' : ''
                    } ${loading ? 'animate-pulse' : ''}`}
            />
            {showText && (
                <span className="text-sm font-medium">
                    {inWishlist ? 'Saved' : 'Save'}
                </span>
            )}
        </button>
    );
};

export default WishlistButton;
