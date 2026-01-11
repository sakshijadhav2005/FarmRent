const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true
    }
}, { timestamps: true });

// Compound index to prevent duplicates
wishlistSchema.index({ user: 1, equipment: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
