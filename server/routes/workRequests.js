const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createRequest,
  getRequestsForWorker,
  getRequestsByOwner,
  respondToRequest,
  getAssignedForWorker,
  searchWorkers
} = require('../controllers/workRequestController');

// Owners/farmers create requests
router.post('/', protect, authorize('owner', 'farmer'), createRequest);

// Owners get their requests
router.get('/owner', protect, authorize('owner', 'farmer'), getRequestsByOwner);

// Workers see available and assigned requests
router.get('/worker', protect, authorize('worker'), getRequestsForWorker);

// Workers get their accepted/assigned work
router.get('/my', protect, authorize('worker'), getAssignedForWorker);

// Worker respond
router.put('/:id/respond', protect, authorize('worker'), respondToRequest);

// Search workers (owners/farmers)
router.get('/search', protect, authorize('owner', 'farmer'), searchWorkers);

module.exports = router;
