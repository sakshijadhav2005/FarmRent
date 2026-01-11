const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

/**
 * Admin Routes
 * All routes require authentication + admin role
 */

// Apply auth middleware to all routes
router.use(protect);
router.use(adminAuth);

// Analytics
router.get('/analytics', adminController.getAnalytics);
router.get('/activities', adminController.getRecentActivities);

// User Management
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Equipment Management
router.get('/equipment', adminController.getAllEquipment);
router.put('/equipment/:id', adminController.updateEquipmentStatus);
router.delete('/equipment/:id', adminController.deleteEquipment);

// Booking Management
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id', adminController.updateBookingStatus);

module.exports = router;
