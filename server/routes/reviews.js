const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createReview,
    getEquipmentReviews,
    getUserReviews,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');

// Public routes
router.get('/equipment/:id', getEquipmentReviews);
router.get('/user/:id', getUserReviews);

// Protected routes
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
