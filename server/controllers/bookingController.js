const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const Notification = require('../models/Notification');
const Wishlist = require('../models/Wishlist');
const { createNotification } = require('./notificationController');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
    try {
        let bookings;
        // Optional date filters: start and end as ISO strings
        const { start, end, equipmentId } = req.query;
        let dateFilter = {};
        if (start || end) {
            // Build range: include bookings that overlap the requested window
            const s = start ? new Date(start) : new Date('1970-01-01');
            const e = end ? new Date(end) : new Date('9999-12-31');
            dateFilter = { $or: [{ startDate: { $lte: e }, endDate: { $gte: s } }] };
        }

        // If user is farmer, show their bookings
        if (req.user.role === 'farmer') {
            bookings = await Booking.find({ farmer: req.user.id, ...(dateFilter || {}) })
                .populate('equipment', 'name type model year pricePerHour available')
                .populate('farmer', 'name email mobile')
                .sort({ createdAt: -1 });
        }
        // If user is owner, show bookings for their equipment
        else if (req.user.role === 'owner') {
            // Find all equipment owned by this user
            const ownerEquipment = await Equipment.find({ owner: req.user.id }).select('_id');
            const equipmentIds = ownerEquipment.map(eq => eq._id);

            // Find all bookings for those equipment
            // If equipmentId provided, restrict to that equipment (must belong to owner)
            const eqFilter = equipmentId ? { equipment: equipmentId } : { equipment: { $in: equipmentIds } };
            bookings = await Booking.find({ ...eqFilter, ...(dateFilter || {}) })
                .populate('equipment', 'name type model year pricePerHour available owner')
                .populate('farmer', 'name email mobile')
                .sort({ createdAt: -1 });
        }
        // If admin, show all
        else if (req.user.role === 'admin') {
            bookings = await Booking.find({ ...(dateFilter || {}) })
                .populate('equipment', 'name type model year pricePerHour available owner')
                .populate('farmer', 'name email mobile')
                .populate('driver', 'name email mobile')
                .sort({ createdAt: -1 });
        }
        // If driver, show bookings where driver is requested AND (driver is null OR driver is me)
        else if (req.user.role === 'driver') {
            const query = {
                driverRequested: true,
                $or: [
                    { driver: null },
                    { driver: req.user.id }
                ],
                ...(dateFilter || {})
            };
            console.log(`[DEBUG] Driver fetching bookings. User: ${req.user.id}, Role: ${req.user.role}`);
            console.log(`[DEBUG] Query:`, JSON.stringify(query));

            bookings = await Booking.find(query)
                .populate('equipment', 'name type model year pricePerHour location owner')
                .populate('farmer', 'name email mobile')
                .populate('driver', 'name email mobile')
                .sort({ createdAt: -1 });

            console.log(`[DEBUG] Found ${bookings.length} bookings`);
        }

        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('equipment')
            .populate('farmer', 'name email mobile')
            .populate('owner', 'name email mobile');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Farmer only)
exports.createBooking = async (req, res) => {
    try {
        const { equipment, startDate, endDate, totalPrice, paymentMethod, driverRequested, driver, driverFee } = req.body;

        // Get equipment details
        // Atomically check availability and set to false to prevent race conditions
        const equipmentData = await Equipment.findOneAndUpdate(
            { _id: equipment, available: true },
            { $set: { available: false } },
            { new: true } // Return updated doc
        );

        if (!equipmentData) {
            return res.status(400).json({ success: false, message: 'Equipment is not available for booking' });
        }

        // Normalize payment method coming from client
        // client may send 'payNow' or 'cod' — map to schema values 'online'|'cod'
        let pm = null;
        if (paymentMethod === 'payNow' || paymentMethod === 'online') pm = 'online';
        else if (paymentMethod === 'cod') pm = 'cod';

        // Decide initial booking status based on payment method
        // - For COD: mark confirmed immediately (owner will expect payment on delivery)
        // - For online: keep pending until payment is confirmed
        const initialStatus = pm === 'cod' ? 'confirmed' : 'pending';
        const paymentStatus = pm === 'online' ? 'pending' : (pm === 'cod' ? 'pending' : 'pending');

        let booking;
        try {
            // Create booking
            booking = await Booking.create({
                equipment,
                farmer: req.user.id,
                owner: equipmentData.owner,
                startDate,
                endDate,
                totalPrice,
                paymentMethod: pm,
                paymentStatus,
                status: initialStatus,
                driverRequested: driverRequested || false,
                driver: driver || null,
                driverFee: driverFee || 0
            });

            // Notify Owner
            await Notification.create({
                user: equipmentData.owner,
                type: 'booking',
                title: 'New Booking Request',
                message: `New booking request for ${equipmentData.name}`,
                data: {
                    bookingId: booking._id,
                    equipmentId: equipment,
                    farmerId: req.user.id
                }
            });

            // Notify Driver if specifically requested during booking
            if (driver) {
                await Notification.create({
                    user: driver,
                    type: 'booking',
                    title: 'New Driving Request',
                    message: `You have been requested as a driver for ${equipmentData.name}`,
                    data: {
                        bookingId: booking._id,
                        equipmentId: equipment,
                        farmerId: req.user.id
                    }
                });
            } else if (driverRequested) {
                // If generic driver request, notify ALL drivers
                const User = require('../models/User'); // Import here to avoid circular dependencies if any, or just strictly local
                const drivers = await User.find({ role: 'driver' });

                const notifications = drivers.map(d => ({
                    user: d._id,
                    type: 'booking',
                    title: 'New Driving Job Available',
                    message: `A new driving job is available for ${equipmentData.name}. Check your dashboard!`,
                    data: {
                        bookingId: booking._id,
                        equipmentId: equipment,
                        farmerId: req.user.id
                    }
                }));

                if (notifications.length > 0) {
                    await Notification.insertMany(notifications);
                }
            }

        } catch (createError) {
            // If booking creation fails, rollback equipment availability
            await Equipment.findByIdAndUpdate(equipment, { available: true });
            throw createError;
        }

        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Private (Owner/Admin)
exports.updateBooking = async (req, res) => {
    try {
        let booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Make sure user is booking owner or admin
        if (booking.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to update this booking' });
        }

        const previousStatus = booking.status;

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('equipment');

        // Notify farmer if status changed
        if (req.body.status && req.body.status !== previousStatus) {
            try {
                await Notification.create({
                    user: booking.farmer,
                    type: 'booking',
                    title: 'Booking Status Update',
                    message: `Your booking for ${booking.equipment?.name || 'equipment'} is now ${req.body.status}`,
                    data: { bookingId: booking._id }
                });
            } catch (err) {
                console.error('Failed to send status update notification', err);
            }
        }

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Make sure user is farmer who made booking or admin
        if (booking.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this booking' });
        }

        // Notify Owner about cancellation before deletion
        try {
            await createNotification(
                booking.owner,
                'booking',
                'Booking Cancelled',
                'A booking has been cancelled by the farmer.',
                { bookingId: booking._id, equipmentId: booking.equipment }
            );
        } catch (err) {
            console.error('Failed to notify owner of cancellation', err);
        }

        // remove the booking
        const equipmentId = booking.equipment;
        await booking.deleteOne();

        // After deletion, check if there are any remaining active bookings for the same equipment
        // Consider bookings with status 'pending' or 'confirmed' as active
        const remaining = await Booking.findOne({
            equipment: equipmentId,
            status: { $in: ['pending', 'confirmed', 'reserved'] }
        });

        // If none remain, mark the equipment as available again
        if (!remaining) {
            try {
                const equipment = await Equipment.findById(equipmentId);
                if (equipment) {
                    equipment.available = true;
                    await equipment.save();

                    // Notify Wishlist Users
                    const wishlists = await Wishlist.find({ equipment: equipmentId });
                    for (const w of wishlists) {
                        await createNotification(
                            w.user,
                            'wishlist',
                            'Equipment Available',
                            `${equipment.name} is now available for booking!`,
                            { equipmentId: equipment._id, equipmentName: equipment.name },
                            true // Send email
                        );
                    }
                }
            } catch (err) {
                console.error('Failed to update equipment availability or notify wishlist:', err);
            }
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Assign driver to booking
// @route   PUT /api/bookings/:id/driver
// @access  Private (Driver only)
exports.assignDriver = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Check if driver was requested
        if (!booking.driverRequested) {
            return res.status(400).json({ success: false, message: 'No driver requested for this booking' });
        }

        // Check if already assigned
        if (booking.driver) {
            return res.status(400).json({ success: false, message: 'Driver already assigned' });
        }

        booking.driver = req.user.id;
        await booking.save();

        // Notify Farmer
        try {
            // Need to populate or fetch equipment name if not present (booking is not populated yet)
            // But we can just say "your booking" if needed, or fetch.
            // Let's populate quickly or assume equipment ID.
            // Actually, let's fetch extended booking or just use generic message.
            const extendedBooking = await Booking.findById(booking._id).populate('equipment');

            await createNotification(
                booking.farmer,
                'booking',
                'Driver Assigned',
                `A driver has accepted your request for ${extendedBooking.equipment?.name || 'your booking'}.`,
                { bookingId: booking._id, driverId: req.user.id }
            );
        } catch (err) {
            console.error('Failed to notify farmer of driver assignment:', err);
        }

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
