const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    sendMessage,
    getChatHistory,
    getSession,
    deleteSession,
    getSuggestions,
    analyzeCropImage
} = require('../controllers/chatController');

// Public route
router.get('/suggestions', getSuggestions);

// Protected routes
router.post('/', protect, sendMessage);
router.post('/analyze-image', protect, analyzeCropImage);
router.get('/history', protect, getChatHistory);
router.get('/session/:id', protect, getSession);
router.delete('/session/:id', protect, deleteSession);

module.exports = router;
