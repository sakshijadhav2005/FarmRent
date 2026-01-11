const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment, reviewType } = req.body;

        if (!bookingId || !rating || !reviewType) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID, rating, and review type are required'
            });
        }

        // Verify booking exists and belongs to user
        const booking = await Booking.findById(bookingId)
            .populate('equipment')
            .populate('farmer')
            .populate('owner');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if booking is completed
        if (booking.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only review completed bookings'
            });
        }

        // Determine reviewer and reviewee based on review type
        let reviewee = null;
        if (reviewType === 'equipment' || reviewType === 'owner') {
            if (booking.farmer._id.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the farmer can review equipment or owner'
                });
            }
            reviewee = booking.owner._id;
        } else if (reviewType === 'farmer') {
            if (booking.owner._id.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the owner can review the farmer'
                });
            }
            reviewee = booking.farmer._id;
        }

        // Check for existing review
        const existingReview = await Review.findOne({
            booking: bookingId,
            reviewer: req.user.id,
            reviewType
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this booking'
            });
        }

        const review = await Review.create({
            booking: bookingId,
            reviewer: req.user.id,
            reviewee,
            equipment: booking.equipment._id,
            rating,
            comment,
            reviewType
        });

        // Mark booking as reviewed
        await Booking.findByIdAndUpdate(bookingId, { isReviewed: true });

        // Notify Reviewee
        try {
            const { createNotification } = require('../controllers/notificationController');
            await createNotification(
                reviewee,
                'review',
                'New Review Received',
                `You received a ${rating}-star review`,
                { reviewId: review._id, bookingId: bookingId, rating }
            );
        } catch (err) {
            console.error('Failed to send review notification:', err);
        }

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create review',
            error: error.message
        });
    }
};

// @desc    Get reviews for equipment
// @route   GET /api/reviews/equipment/:id
// @access  Public
exports.getEquipmentReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ equipment: id, reviewType: 'equipment' })
            .populate('reviewer', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({ equipment: id, reviewType: 'equipment' });

        // Get rating distribution
        const distribution = await Review.aggregate([
            { $match: { equipment: require('mongoose').Types.ObjectId(id), reviewType: 'equipment' } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);

        res.json({
            success: true,
            data: reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            distribution
        });
    } catch (error) {
        console.error('Get equipment reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
};

// @desc    Get reviews for user
// @route   GET /api/reviews/user/:id
// @access  Public
exports.getUserReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'farmer' or 'owner'

        const query = { reviewee: id };
        if (type) query.reviewType = type;

        const reviews = await Review.find(query)
            .populate('reviewer', 'name')
            .populate('equipment', 'name image')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (review.reviewer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }

        // Check if within 48 hours
        const hoursSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60);
        if (hoursSinceCreation > 48) {
            return res.status(400).json({
                success: false,
                message: 'Reviews can only be edited within 48 hours'
            });
        }

        const { rating, comment } = req.body;
        if (rating) review.rating = rating;
        if (comment !== undefined) review.comment = comment;

        await review.save();

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review'
        });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }

        await review.remove();

        res.json({
            success: true,
            message: 'Review deleted'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review'
        });
    }
};
