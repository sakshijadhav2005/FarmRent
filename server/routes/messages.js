/**
 * Message Routes
 * ==============
 * API routes for the P2P (peer-to-peer) messaging system in FarmLink.
 * 
 * All routes require authentication (Bearer token in Authorization header).
 * 
 * Available Endpoints:
 * - POST   /api/messages/send                  - Send a new message
 * - GET    /api/messages/conversations         - List all conversations
 * - GET    /api/messages/conversation/:userId  - Get messages with a user
 * - GET    /api/messages/unread-count          - Get unread message count
 * - PUT    /api/messages/read/:senderId        - Mark messages as read
 * 
 * @author FarmLink Development Team
 */

const express = require('express');
const router = express.Router();

// Import authentication middleware
// This ensures only logged-in users can access messages
const { protect } = require('../middleware/auth');

// Import controller functions
const {
    sendMessage,
    getConversation,
    getConversations,
    getUnreadCount,
    markAsRead
} = require('../controllers/messageController');

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
// Apply to ALL routes - users must be logged in to use messaging
router.use(protect);

// ============================================
// MESSAGE ROUTES
// ============================================

/**
 * @route   POST /api/messages/send
 * @desc    Send a message to another user
 * @body    { recipientId: string, content: string, equipmentId?: string }
 * @access  Private
 */
router.post('/send', sendMessage);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get list of all conversations for the logged-in user
 *          Returns conversation participants, last message, and unread count
 * @access  Private
 */
router.get('/conversations', getConversations);

/**
 * @route   GET /api/messages/conversation/:recipientId
 * @desc    Get all messages in a conversation with a specific user
 *          Also marks incoming messages as read
 * @query   equipmentId - Optional: Filter messages by equipment
 * @access  Private
 */
router.get('/conversation/:recipientId', getConversation);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get the count of unread messages for the current user
 *          Useful for notification badges
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PUT /api/messages/read/:senderId
 * @desc    Mark all messages from a specific sender as read
 *          Called when opening a conversation
 * @access  Private
 */
router.put('/read/:senderId', markAsRead);

module.exports = router;
