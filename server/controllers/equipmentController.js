const Equipment = require('../models/Equipment');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Public
exports.getEquipment = asyncHandler(async (req, res) => {
    const equipment = await Equipment.find().populate('owner', 'name email');
    res.status(200).json(new ApiResponse(200, equipment, 'Equipment fetched successfully', { count: equipment.length }));
});

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Public
exports.getEquipmentById = asyncHandler(async (req, res) => {
    const equipment = await Equipment.findById(req.params.id).populate('owner', 'name email mobile');

    if (!equipment) {
        throw ApiError.notFound('Equipment not found');
    }

    res.status(200).json(new ApiResponse(200, equipment, 'Equipment fetched successfully'));
});

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private (Owner only)
exports.createEquipment = asyncHandler(async (req, res) => {
    req.body.owner = req.user.id;

    // If no coordinates provided, add some random jitter around India center for demo
    if (!req.body.coordinates) {
        const baseLat = 20.5937;
        const baseLng = 78.9629;
        // Random offset roughly within ~100-200km
        const latJitter = (Math.random() - 0.5) * 4;
        const lngJitter = (Math.random() - 0.5) * 4;

        req.body.coordinates = {
            lat: baseLat + latJitter,
            lng: baseLng + lngJitter
        };
    }

    // If a file was uploaded, add its URL (Cloudinary/S3/R2) or local path to the request body
    if (req.file) {
        // Debug: Log what multer/cloudinary returned
        logger.debug('File upload received', { file: req.file });

        // cloudinary uses 'path', multer-s3 provides 'location'
        req.body.image = req.file.path || req.file.location || `/uploads/${req.file.filename}`;
        logger.debug('Final image URL', { imageUrl: req.body.image });
    }

    const equipment = await Equipment.create(req.body);

    // Notify All Farmers
    try {
        const User = require('../models/User');
        const { createNotification } = require('./notificationController');

        const farmers = await User.find({ role: 'farmer' }).select('_id');

        if (farmers.length > 0) {
            const notifications = farmers.map(farmer =>
                createNotification(
                    farmer._id,
                    'system',
                    'New Equipment Available',
                    `New ${equipment.name} is now available for rent near you!`,
                    { equipmentId: equipment._id }
                )
            );
            await Promise.all(notifications);
            logger.info('Notified farmers of new equipment', { equipmentId: equipment._id, farmerCount: farmers.length });
        }
    } catch (notifErr) {
        logger.error('Failed to notify farmers of new equipment', { error: notifErr.message });
    }

    res.status(201).json(new ApiResponse(201, equipment, 'Equipment created successfully'));
});

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private (Owner only)
exports.updateEquipment = asyncHandler(async (req, res) => {
    let equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
        throw ApiError.notFound('Equipment not found');
    }

    // Make sure user is equipment owner
    if (equipment.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        throw ApiError.forbidden('Not authorized to update this equipment');
    }

    equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json(new ApiResponse(200, equipment, 'Equipment updated successfully'));
});

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private (Owner only)
exports.deleteEquipment = asyncHandler(async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
        throw ApiError.notFound('Equipment not found');
    }

    // Make sure user is equipment owner
    if (equipment.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        throw ApiError.forbidden('Not authorized to delete this equipment');
    }

    await equipment.deleteOne();

    logger.info('Equipment deleted', { equipmentId: req.params.id, deletedBy: req.user.id });

    res.status(200).json(new ApiResponse(200, {}, 'Equipment deleted successfully'));
});

