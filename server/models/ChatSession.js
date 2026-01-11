const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    context: {
        crop: String,
        location: String,
        weather: mongoose.Schema.Types.Mixed,
        equipment: String
    }
}, { timestamps: true });

const chatSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    messages: [chatMessageSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for faster queries
chatSessionSchema.index({ user: 1, isActive: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
