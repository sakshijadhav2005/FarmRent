/**
 * Message Controller
 * ==================
 * Handles all P2P (peer-to-peer) messaging operations in FarmLink.
 * 
 * This controller provides endpoints for:
 * - Sending messages between users
 * - Fetching conversation history
 * - Listing all user conversations
 * - Tracking unread message counts
 * - Marking messages as read
 * 
 * @author FarmLink Development Team
 */

const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Send a Message
 * ==============
 * Creates a new message from the authenticated user to another user.
 * 
 * @route   POST /api/messages/send
 * @access  Private (requires authentication)
 * 
 * @param {string} req.body.recipientId - ID of the user receiving the message
 * @param {string} req.body.content - The message text content
 * @param {string} [req.body.equipmentId] - Optional: Link message to specific equipment
 * 
 * @returns {Object} The created message with sender info populated
 */
exports.sendMessage = async (req, res) => {
    try {
        // Extract data from request body
        const { recipientId, content, equipmentId } = req.body;

        // Get sender ID from authenticated user (set by auth middleware)
        const senderId = req.user.id;

        // Validate required fields
        if (!recipientId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Recipient and content are required'
            });
        }

        // Verify the recipient user exists in database
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: 'Recipient not found'
            });
        }

        // Create the message document in MongoDB
        const message = await Message.create({
            sender: senderId,
            recipient: recipientId,
            content: content.trim(),  // Remove extra whitespace
            equipment: equipmentId || null  // Optional equipment reference
        });

        // Populate sender information for the response
        // This adds name and email from the User model
        await message.populate('sender', 'name email');

        // Return success with the created message
        res.status(201).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};


/**
 * Get Conversation with a Specific User
 * ======================================
 * Retrieves all messages between the authenticated user and another user.
 * Also automatically marks incoming messages as read.
 * 
 * @route   GET /api/messages/conversation/:recipientId
 * @access  Private (requires authentication)
 * 
 * @param {string} req.params.recipientId - ID of the other user in conversation
 * @param {string} [req.query.equipmentId] - Optional: Filter by equipment
 * 
 * @returns {Array} List of messages sorted by creation time (oldest first)
 */
exports.getConversation = async (req, res) => {
    try {
        // Get the other user's ID from URL params
        const { recipientId } = req.params;

        // Optional equipment filter from query string
        const { equipmentId } = req.query;

        // Current authenticated user's ID
        const userId = req.user.id;

        // Build query to find all messages between these two users
        // Uses $or to get both sent and received messages
        const query = {
            $or: [
                { sender: userId, recipient: recipientId },      // Messages I sent
                { sender: recipientId, recipient: userId }       // Messages I received
            ]
        };

        // Optionally filter to only show messages about specific equipment
        if (equipmentId) {
            query.equipment = equipmentId;
        }

        // Fetch messages with user details populated
        const messages = await Message.find(query)
            .populate('sender', 'name email')       // Include sender's name/email
            .populate('recipient', 'name email')    // Include recipient's name/email
            .sort({ createdAt: 1 })                 // Oldest first for chat display
            .limit(100);                            // Limit for performance

        // AUTO-READ FEATURE: Mark all incoming messages as read
        // This happens when user opens a conversation
        await Message.updateMany(
            { sender: recipientId, recipient: userId, read: false },
            { read: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversation'
        });
    }
};

// Get all conversations for a user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get unique conversation partners
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(userId) },
                        { recipient: new mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
                            '$recipient',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$recipient', new mongoose.Types.ObjectId(userId)] },
                                        { $eq: ['$read', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'participant'
                }
            },
            {
                $unwind: '$participant'
            },
            {
                $lookup: {
                    from: 'equipments',
                    localField: 'lastMessage.equipment',
                    foreignField: '_id',
                    as: 'equipment'
                }
            },
            {
                $unwind: { path: '$equipment', preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    participant: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        role: 1
                    },
                    lastMessage: {
                        _id: 1,
                        content: 1,
                        createdAt: 1,
                        read: 1
                    },
                    equipment: {
                        _id: 1,
                        name: 1
                    },
                    unreadCount: 1
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversations'
        });
    }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Message.countDocuments({
            recipient: userId,
            read: false
        });

        res.status(200).json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count'
        });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const { senderId } = req.params;
        const userId = req.user.id;

        await Message.updateMany(
            { sender: senderId, recipient: userId, read: false },
            { read: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read'
        });
    }
};
