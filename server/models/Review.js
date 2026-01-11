const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: 500
    },
    reviewType: {
        type: String,
        enum: ['equipment', 'farmer', 'owner'],
        required: true
    },
    isEditable: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Compound index to prevent duplicate reviews
reviewSchema.index({ booking: 1, reviewer: 1, reviewType: 1 }, { unique: true });

// Static method to calculate average rating for equipment
reviewSchema.statics.calculateEquipmentRating = async function (equipmentId) {
    const result = await this.aggregate([
        { $match: { equipment: equipmentId, reviewType: 'equipment' } },
        { $group: { _id: '$equipment', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    try {
        const Equipment = require('./Equipment');
        if (result.length > 0) {
            await Equipment.findByIdAndUpdate(equipmentId, {
                avgRating: Math.round(result[0].avgRating * 10) / 10,
                totalReviews: result[0].count
            });
        } else {
            await Equipment.findByIdAndUpdate(equipmentId, {
                avgRating: 0,
                totalReviews: 0
            });
        }
    } catch (err) {
        console.error('Error updating equipment rating:', err);
    }
};

// Static method to calculate average rating for user
reviewSchema.statics.calculateUserRating = async function (userId, reviewType) {
    const result = await this.aggregate([
        { $match: { reviewee: userId, reviewType: reviewType } },
        { $group: { _id: '$reviewee', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    try {
        const User = require('./User');
        if (result.length > 0) {
            await User.findByIdAndUpdate(userId, {
                avgRating: Math.round(result[0].avgRating * 10) / 10,
                totalReviews: result[0].count
            });
        }
    } catch (err) {
        console.error('Error updating user rating:', err);
    }
};

// Post save hook to update ratings
reviewSchema.post('save', async function () {
    await this.constructor.calculateEquipmentRating(this.equipment);
    if (this.reviewee) {
        await this.constructor.calculateUserRating(this.reviewee, this.reviewType);
    }
});

// Post remove hook to update ratings
reviewSchema.post('remove', async function () {
    await this.constructor.calculateEquipmentRating(this.equipment);
    if (this.reviewee) {
        await this.constructor.calculateUserRating(this.reviewee, this.reviewType);
    }
});

module.exports = mongoose.model('Review', reviewSchema);
