import React, { useState, useEffect } from 'react';
import { Star, User, Clock, ThumbsUp } from 'lucide-react';
import { getEquipmentReviews } from '../api';

/**
 * Rating Stars Component
 */
export const RatingStars = ({ rating, size = 'md', interactive = false, onChange }) => {
    const [hovered, setHovered] = useState(0);
    const sizes = { sm: 'w-3 h-3', md: 'w-5 h-5', lg: 'w-6 h-6' };

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && onChange?.(star)}
                    onMouseEnter={() => interactive && setHovered(star)}
                    onMouseLeave={() => interactive && setHovered(0)}
                    className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                >
                    <Star
                        className={`${sizes[size]} ${star <= (hovered || rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-500'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
};

/**
 * Individual Review Card
 */
export const ReviewCard = ({ review }) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-primary-light font-bold">
                        {review.reviewer?.name?.[0] || 'U'}
                    </span>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-brand-text-light text-sm truncate">
                            {review.reviewer?.name || 'Anonymous'}
                        </span>
                        <div className="flex items-center gap-1 text-brand-text-muted text-xs">
                            <Clock className="w-3 h-3" />
                            {formatDate(review.createdAt)}
                        </div>
                    </div>

                    {/* Rating */}
                    <RatingStars rating={review.rating} size="sm" />

                    {/* Comment */}
                    {review.comment && (
                        <p className="text-brand-text mt-2 text-sm leading-relaxed">
                            {review.comment}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Rating Distribution Bar
 */
const RatingBar = ({ star, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-brand-text-muted w-4">{star}</span>
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-xs text-brand-text-muted w-8">{count}</span>
        </div>
    );
};

/**
 * Reviews Section Component
 * Displays reviews for equipment with rating summary
 */
const ReviewsSection = ({ equipmentId, avgRating = 0, totalReviews = 0 }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [distribution, setDistribution] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [equipmentId, page]);

    const fetchReviews = async () => {
        if (!equipmentId) return;

        setLoading(true);
        try {
            const response = await getEquipmentReviews(equipmentId, page);
            if (response.data?.success) {
                if (page === 1) {
                    setReviews(response.data.data);
                    setDistribution(response.data.distribution || []);
                } else {
                    setReviews(prev => [...prev, ...response.data.data]);
                }
                setHasMore(response.data.pagination?.page < response.data.pagination?.pages);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    // Build distribution map
    const getDistributionCount = (star) => {
        const item = distribution.find(d => d._id === star);
        return item?.count || 0;
    };

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-brand-text-light mb-4">
                Reviews & Ratings
            </h3>

            {/* Rating Summary */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Average Rating */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center">
                    <div className="text-5xl font-bold text-brand-secondary-light mb-2">
                        {avgRating?.toFixed(1) || '0.0'}
                    </div>
                    <RatingStars rating={Math.round(avgRating)} size="lg" />
                    <p className="text-brand-text-muted mt-2 text-sm">
                        Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Distribution */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(star => (
                            <RatingBar
                                key={star}
                                star={star}
                                count={getDistributionCount(star)}
                                total={totalReviews}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {loading && reviews.length === 0 ? (
                    <div className="text-center py-8 text-brand-text-muted">
                        Loading reviews...
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                        <Star className="w-12 h-12 text-brand-text-muted mx-auto mb-3" />
                        <p className="text-brand-text-muted">No reviews yet</p>
                        <p className="text-sm text-brand-text-dark mt-1">
                            Be the first to review this equipment!
                        </p>
                    </div>
                ) : (
                    <>
                        {reviews.map(review => (
                            <ReviewCard key={review._id} review={review} />
                        ))}

                        {hasMore && (
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={loading}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-brand-text-light font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Load More Reviews'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ReviewsSection;
