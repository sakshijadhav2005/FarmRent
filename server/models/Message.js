/**
 * Message Model
 * =============
 * This model stores direct messages between users (farmers, owners, workers).
 * Used for the P2P (peer-to-peer) chat system in FarmLink.
 * 
 * Features:
 * - Supports conversations between any two users
 * - Can be linked to specific equipment for context
 * - Tracks read/unread status for notifications
 * - Timestamps for message ordering
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // The user who sent the message
    // References the User model for population
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // The user who receives the message
    // References the User model for population
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // The actual message content
    // Limited to 2000 characters to prevent abuse
    content: {
        type: String,
        required: true,
        trim: true,              // Removes whitespace from both ends
        maxlength: 2000          // Maximum message length
    },

    // Optional: Link message to a specific equipment
    // Useful when discussing a particular rental
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment'
    },

    // Track if the recipient has read the message
    // Used for read receipts (✓✓) in the UI
    read: {
        type: Boolean,
        default: false
    },

    // When the message was read (for analytics)
    readAt: {
        type: Date
    }
}, {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
});

/**
 * Database Indexes
 * ================
 * Indexes improve query performance for common operations:
 * 
 * 1. sender + recipient + createdAt: Fast conversation lookups
 * 2. recipient + read: Quick unread count queries
 * 3. equipment: Filter messages by equipment
 */
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, read: 1 });
messageSchema.index({ equipment: 1 });

module.exports = mongoose.model('Message', messageSchema);
