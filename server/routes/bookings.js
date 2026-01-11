const express = require('express');
const {
    getBookings,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking,
    assignDriver
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getBookings)
    .post(protect, authorize('farmer', 'admin'), createBooking);

router.put('/:id/driver', protect, authorize('driver'), assignDriver);

router.route('/:id')
    .get(protect, getBookingById)
    .put(protect, authorize('owner', 'admin'), updateBooking)
    .delete(protect, deleteBooking);

module.exports = router;
