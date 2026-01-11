// controllers/dashboardController.js
const Equipment = require("../models/Equipment");
const Booking = require("../models/Booking");

exports.getDashboardStats = async (req, res) => {
    try {
        let query = {};

        // Role-based filtering
        if (req.user.role === 'farmer') {
            query.farmer = req.user.id;
        } else if (req.user.role === 'owner') {
            query.owner = req.user.id;
        }
        // Admin sees all (query remains empty)

        const totalBookings = await Booking.countDocuments(query);
        const activeRentals = await Booking.countDocuments({ ...query, status: "confirmed" });
        const pendingRequests = await Booking.countDocuments({ ...query, status: "pending" });

        const recent = await Booking.find(query)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('equipment', 'name');

        res.status(200).json({
            totalBookings,
            activeRentals,
            pendingRequests,
            recent: recent.map(b => ({
                equipmentName: b.equipment?.name || 'Unknown Equipment',
                date: b.createdAt,
                status: b.status,
                _id: b._id
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
