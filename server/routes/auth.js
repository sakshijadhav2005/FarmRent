const express = require('express');
const { registerUser, login, getMe, updateMe, googleAuth, googleCallback, completeGoogleProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/google/complete-profile', completeGoogleProfile);

module.exports = router;
