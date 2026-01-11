const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    checkWishlist,
    getWishlistCount
} = require('../controllers/wishlistController');

// All wishlist routes are protected
router.use(protect);

router.post('/', addToWishlist);
router.delete('/:equipmentId', removeFromWishlist);
router.get('/', getWishlist);
router.get('/check/:equipmentId', checkWishlist);
router.get('/count', getWishlistCount);

module.exports = router;
