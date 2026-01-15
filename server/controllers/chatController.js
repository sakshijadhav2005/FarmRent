const ChatSession = require('../models/ChatSession');
const Equipment = require('../models/Equipment');
const aiService = require('../services/aiService');

// @desc    Send message to AI and get response
// @route   POST /api/chat
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { message, sessionId, context } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        let session;

        // Get or create session
        if (sessionId) {
            session = await ChatSession.findOne({
                _id: sessionId,
                user: req.user.id,
                isActive: true
            });
        }

        if (!session) {
            session = await ChatSession.create({
                user: req.user.id,
                title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
                messages: []
            });
        }

        // Add user message
        session.messages.push({
            role: 'user',
            content: message,
            context
        });

        // --- INTELLIGENT CONTEXT GATHERING ---
        let dbContext = {};

        // 1. Detect Intent: Looking for equipment? location?
        // Simple heuristic: check if message contains known equipment types or "hire" / "rent"
        const lowerMsg = message.toLowerCase();
        const equipmentTypes = ['tractor', 'harvester', 'drone', 'tiller', 'sprayer', 'planter'];
        const foundTypes = equipmentTypes.filter(t => lowerMsg.includes(t));

        // If equipment mentioned, try to find matches in DB
        if (foundTypes.length > 0 || lowerMsg.includes('harvest') || lowerMsg.includes('farm')) {
            // Try to extract location (naive approach: extract capitalized words could be location, or just search all)
            // For V1, let's fetch 'available' equipment matching the Types found, or just recent ones if generic.

            let query = { available: true };
            if (foundTypes.length > 0) {
                query.type = { $in: foundTypes.map(t => new RegExp(t, 'i')) };
            }

            // If message contains keywords that match existing locations in DB (optional advanced step)
            // simplified: fetch up to 5 relevant items
            const equipmentMatches = await Equipment.find(query)
                .select('name type location pricePerHour available')
                .limit(5);

            if (equipmentMatches.length > 0) {
                dbContext.equipment = equipmentMatches.map(e =>
                    `- ${e.name} (${e.type}) in ${e.location} @ ₹${e.pricePerHour}/hr (ID: ${e._id})`
                ).join('\n');
            }
        }
        // -------------------------------------

        // Generate AI response with enhanced context
        const fullContext = { ...context, ...dbContext };
        const aiResponse = await aiService.generateAIResponse(message, fullContext);

        // Add AI response
        session.messages.push({
            role: 'assistant',
            content: aiResponse
        });

        await session.save();

        res.json({
            success: true,
            data: {
                sessionId: session._id,
                response: aiResponse,
                messages: session.messages.slice(-2) // Return last exchange
            }
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process message'
        });
    }
};

// @desc    Get chat history
// @route   GET /api/chat/history
// @access  Private
exports.getChatHistory = async (req, res) => {
    try {
        const sessions = await ChatSession.find({
            user: req.user.id,
            isActive: true
        })
            .select('title messages createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(20);

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat history'
        });
    }
};

// @desc    Get single chat session
// @route   GET /api/chat/session/:id
// @access  Private
exports.getSession = async (req, res) => {
    try {
        const session = await ChatSession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch session'
        });
    }
};

// @desc    Delete chat session
// @route   DELETE /api/chat/session/:id
// @access  Private
exports.deleteSession = async (req, res) => {
    try {
        const session = await ChatSession.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isActive: false },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            message: 'Session deleted'
        });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete session'
        });
    }
};

// @desc    Analyze crop image using Gemini Vision
// @route   POST /api/chat/analyze-image
// @access  Private
exports.analyzeCropImage = async (req, res) => {
    try {
        const { base64Image, mimeType, message } = req.body;

        if (!base64Image) {
            return res.status(400).json({
                success: false,
                message: 'Image data is required'
            });
        }

        // Call AI service for vision analysis
        const aiResponse = await aiService.analyzeImage(base64Image, mimeType || 'image/jpeg', message);

        // We could also save this to a chat session if needed
        // For now, just return the response
        res.json({
            success: true,
            data: {
                response: aiResponse
            }
        });
    } catch (error) {
        console.error('Image analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze image'
        });
    }
};

// @desc    Get quick suggestions
// @route   GET /api/chat/suggestions
// @access  Public
exports.getSuggestions = async (req, res) => {
    const suggestions = [
        { text: "What equipment do I need for rice farming?", icon: "🌾" },
        { text: "Best time to use harvester this week?", icon: "🚜" },
        { text: "How to prepare soil for wheat?", icon: "🌱" },
        { text: "Recommend equipment for 5 acre farm", icon: "📏" },
        { text: "Tips for monsoon farming", icon: "🌧️" },
        { text: "How to use a drone for spraying?", icon: "🛸" }
    ];

    res.json({
        success: true,
        data: suggestions
    });
};

