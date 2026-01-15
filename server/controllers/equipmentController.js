const Equipment = require('../models/Equipment');

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Public
exports.getEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.find().populate('owner', 'name email');
        res.status(200).json({ success: true, count: equipment.length, data: equipment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Public
exports.getEquipmentById = async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id).populate('owner', 'name email mobile');
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        res.status(200).json({ success: true, data: equipment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private (Owner only)
exports.createEquipment = async (req, res) => {
    try {
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
            // cloudinary uses 'path', multer-s3 provides 'location'
            req.body.image = req.file.path || req.file.location || `/uploads/${req.file.filename}`;
        }

        const equipment = await Equipment.create(req.body);

        // Notify All Farmers
        try {
            const User = require('../models/User');
            // Avoid circular ref if using controller, but models are fine
            // We can use the Notification model directly or the helper
            const { createNotification } = require('./notificationController');

            const farmers = await User.find({ role: 'farmer' }).select('_id');

            // Use Promise.all to send efficiently
            // Limit to a reasonable number if scaling, but for now this is fine or use a job queue in production
            if (farmers.length > 0) {
                const notifications = farmers.map(farmer =>
                    createNotification(
                        farmer._id,
                        'system', // or 'wishlist' type if appropriate, but 'system' fits "New Arrival" better
                        'New Equipment Available',
                        `New ${equipment.name} is now available for rent near you!`,
                        { equipmentId: equipment._id }
                    )
                );
                await Promise.all(notifications);
            }
        } catch (notifErr) {
            console.error('Failed to notify farmers of new equipment:', notifErr);
        }

        res.status(201).json({ success: true, data: equipment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private (Owner only)
exports.updateEquipment = async (req, res) => {
    try {
        let equipment = await Equipment.findById(req.params.id);
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        // Make sure user is equipment owner
        if (equipment.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to update this equipment' });
        }

        equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: equipment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private (Owner only)
exports.deleteEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        // Make sure user is equipment owner
        if (equipment.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this equipment' });
        }

        await equipment.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
