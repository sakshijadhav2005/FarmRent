const Wishlist = require('../models/Wishlist');
const Equipment = require('../models/Equipment');

// @desc    Add equipment to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addToWishlist = async (req, res) => {
    try {
        const { equipmentId } = req.body;

        if (!equipmentId) {
            return res.status(400).json({
                success: false,
                message: 'Equipment ID is required'
            });
        }

        // Check if equipment exists
        const equipment = await Equipment.findById(equipmentId);
        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        // Check if already in wishlist
        const existing = await Wishlist.findOne({
            user: req.user.id,
            equipment: equipmentId
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Equipment already in wishlist'
            });
        }

        const wishlistItem = await Wishlist.create({
            user: req.user.id,
            equipment: equipmentId
        });

        res.status(201).json({
            success: true,
            data: wishlistItem
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add to wishlist'
        });
    }
};

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:equipmentId
// @access  Private
exports.removeFromWishlist = async (req, res) => {
    try {
        const { equipmentId } = req.params;

        const result = await Wishlist.findOneAndDelete({
            user: req.user.id,
            equipment: equipmentId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in wishlist'
            });
        }

        res.json({
            success: true,
            message: 'Removed from wishlist'
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove from wishlist'
        });
    }
};

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ user: req.user.id })
            .populate({
                path: 'equipment',
                populate: { path: 'owner', select: 'name' }
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: wishlist,
            count: wishlist.length
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wishlist'
        });
    }
};

// @desc    Check if equipment is in wishlist
// @route   GET /api/wishlist/check/:equipmentId
// @access  Private
exports.checkWishlist = async (req, res) => {
    try {
        const { equipmentId } = req.params;

        const item = await Wishlist.findOne({
            user: req.user.id,
            equipment: equipmentId
        });

        res.json({
            success: true,
            inWishlist: !!item
        });
    } catch (error) {
        console.error('Check wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check wishlist'
        });
    }
};

// @desc    Get wishlist count
// @route   GET /api/wishlist/count
// @access  Private
exports.getWishlistCount = async (req, res) => {
    try {
        const count = await Wishlist.countDocuments({ user: req.user.id });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Get wishlist count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wishlist count'
        });
    }
};
