const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

/**
 * Admin Controller
 * Handles admin dashboard operations
 */

// Get platform analytics
exports.getAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // User stats
        const totalUsers = await User.countDocuments();
        const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Equipment stats
        const totalEquipment = await Equipment.countDocuments();
        const activeEquipment = await Equipment.countDocuments({ available: true });
        const equipmentByType = await Equipment.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Booking stats
        const totalBookings = await Booking.countDocuments();
        const bookingsThisMonth = await Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const bookingsThisWeek = await Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const bookingsByStatus = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Revenue stats
        const revenueData = await Booking.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueData[0]?.total || 0;

        const monthlyRevenue = await Booking.aggregate([
            { $match: { paymentStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        // Daily bookings trend (last 7 days)
        const dailyBookings = await Booking.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalPrice' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top equipment (most booked)
        const topEquipment = await Booking.aggregate([
            { $group: { _id: '$equipment', bookingCount: { $sum: 1 } } },
            { $sort: { bookingCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'equipment',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'equipmentDetails'
                }
            },
            { $unwind: '$equipmentDetails' }
        ]);

        // Top owners (by bookings)
        const topOwners = await Booking.aggregate([
            {
                $lookup: {
                    from: 'equipment',
                    localField: 'equipment',
                    foreignField: '_id',
                    as: 'equipmentDetails'
                }
            },
            { $unwind: '$equipmentDetails' },
            { $group: { _id: '$equipmentDetails.owner', bookingCount: { $sum: 1 } } },
            { $sort: { bookingCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'ownerDetails'
                }
            },
            { $unwind: '$ownerDetails' }
        ]);

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    newThisMonth: newUsersThisMonth,
                    byRole: usersByRole
                },
                equipment: {
                    total: totalEquipment,
                    active: activeEquipment,
                    byType: equipmentByType
                },
                bookings: {
                    total: totalBookings,
                    thisMonth: bookingsThisMonth,
                    thisWeek: bookingsThisWeek,
                    byStatus: bookingsByStatus,
                    dailyTrend: dailyBookings
                },
                revenue: {
                    total: totalRevenue,
                    thisMonth: monthlyRevenue[0]?.total || 0
                },
                topEquipment,
                topOwners
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};

// Get all users with pagination and filters
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { mobile: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

// Update user (admin can change role, status, etc.)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, isActive, isVerified } = req.body;

        const updates = {};
        if (role) updates.role = role;
        if (typeof isActive === 'boolean') updates.isActive = isActive;
        if (typeof isVerified === 'boolean') updates.isVerified = isVerified;

        const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: user, message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting self
        if (id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};

// Get all equipment for admin
exports.getAllEquipment = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (req.query.type) filter.type = req.query.type;
        if (req.query.available) filter.available = req.query.available === 'true';
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { model: { $regex: req.query.search, $options: 'i' } },
                { location: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const equipment = await Equipment.find(filter)
            .populate('owner', 'name email mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Equipment.countDocuments(filter);

        res.json({
            success: true,
            data: equipment,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch equipment' });
    }
};

// Update equipment status
exports.updateEquipmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { available, isVerified, isFeatured } = req.body;

        const updates = {};
        if (typeof available === 'boolean') updates.available = available;
        if (typeof isVerified === 'boolean') updates.isVerified = isVerified;
        if (typeof isFeatured === 'boolean') updates.isFeatured = isFeatured;

        const equipment = await Equipment.findByIdAndUpdate(id, updates, { new: true })
            .populate('owner', 'name email');

        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        res.json({ success: true, data: equipment, message: 'Equipment updated successfully' });
    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to update equipment' });
    }
};

// Delete equipment
exports.deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;

        const equipment = await Equipment.findByIdAndDelete(id);

        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        // Also delete associated bookings
        await Booking.deleteMany({ equipment: id });

        res.json({ success: true, message: 'Equipment and associated bookings deleted' });
    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete equipment' });
    }
};

// Get all bookings for admin
exports.getAllBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

        const bookings = await Booking.find(filter)
            .populate('farmer', 'name email mobile')
            .populate('equipment', 'name type location pricePerHour')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Booking.countDocuments(filter);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentStatus } = req.body;

        const updates = {};
        if (status) updates.status = status;
        if (paymentStatus) updates.paymentStatus = paymentStatus;

        const booking = await Booking.findByIdAndUpdate(id, updates, { new: true })
            .populate('farmer', 'name email')
            .populate('equipment', 'name type');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, data: booking, message: 'Booking updated successfully' });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ success: false, message: 'Failed to update booking' });
    }
};

// Get recent activities
exports.getRecentActivities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        // Recent bookings
        const recentBookings = await Booking.find()
            .populate('farmer', 'name')
            .populate('equipment', 'name')
            .sort({ createdAt: -1 })
            .limit(limit / 2);

        // Recent users
        const recentUsers = await User.find()
            .select('name email role createdAt')
            .sort({ createdAt: -1 })
            .limit(limit / 2);

        // Combine and sort by date
        const activities = [
            ...recentBookings.map(b => ({
                type: 'booking',
                message: `${b.farmer?.name || 'User'} booked ${b.equipment?.name || 'equipment'}`,
                status: b.status,
                createdAt: b.createdAt
            })),
            ...recentUsers.map(u => ({
                type: 'user',
                message: `${u.name} joined as ${u.role}`,
                createdAt: u.createdAt
            }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);

        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch activities' });
    }
};
