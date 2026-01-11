const WorkRequest = require('../models/WorkRequest');
const User = require('../models/User');

// Create a new work request (owner/farmer creates request to find workers)
exports.createRequest = async (req, res) => {
  try {
    const { typeOfWork, paymentAmount, requiredCount, location, startDate, endDate, notes, title } = req.body;

    if (!typeOfWork || !paymentAmount) {
      return res.status(400).json({ success: false, message: 'Type of work and payment amount are required' });
    }

    const workRequest = await WorkRequest.create({
      title,
      typeOfWork,
      paymentAmount,
      requiredCount: requiredCount || 1,
      location,
      startDate,
      endDate,
      notes,
      owner: req.user.id,
      // record initial posted event in history
      responseHistory: [{ user: req.user.id, action: 'posted', at: new Date() }]
    });

    return res.status(201).json({ success: true, data: workRequest });
  } catch (err) {
    console.error('Create work request error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create work request' });
  }
};

// Get requests assigned to a worker or available for worker (pending)
exports.getRequestsForWorker = async (req, res) => {
  try {
    // Return pending requests and those assigned to this worker
    const requests = await WorkRequest.find({
      $and: [
        { $or: [{ status: 'pending' }, { worker: req.user.id }] },
        // ensure we only return documents that have work-request specific fields
        { typeOfWork: { $exists: true } },
        // ensure we EXCLUDE bookings, which may have been saved to the same collection
        { equipment: { $exists: false } },
        { farmer: { $exists: false } },
      ]
    }).populate('owner', 'name mobile role').populate('respondedBy', 'name mobile').populate('responseHistory.user', 'name mobile');

    console.debug(`WorkRequest: returning ${requests.length} items for worker ${req.user.id}`);

    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error('Get requests for worker error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get requests' });
  }
};

// Get requests created by owner/farmer
exports.getRequestsByOwner = async (req, res) => {
  try {
    const requests = await WorkRequest.find({ owner: req.user.id }).populate('worker', 'name mobile').populate('respondedBy', 'name mobile').populate('responseHistory.user', 'name mobile');
    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error('Get requests by owner error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get requests' });
  }
};

// Get accepted/assigned work for the logged in worker
exports.getAssignedForWorker = async (req, res) => {
  try {
    const assigned = await WorkRequest.find({
      $and: [
        {
          $or: [
            { worker: req.user.id, status: 'accepted' },
            { respondedBy: req.user.id, status: 'rejected' }
          ]
        },
        // ensure we EXCLUDE bookings
        { equipment: { $exists: false } },
        { farmer: { $exists: false } },
      ]
    }).populate('owner', 'name mobile').populate('respondedBy', 'name mobile').populate('responseHistory.user', 'name mobile');
    return res.status(200).json({ success: true, data: assigned });
  } catch (err) {
    console.error('Get assigned work for worker error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get assigned work' });
  }
};

const fs = require('fs');
const path = require('path');

// Worker accepts or rejects a request
exports.respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    // Debug logging to file
    const logData = `
----------------------------------------
Time: ${new Date().toISOString()}
ID: ${id}
User: ${req.user.id}
Method: ${req.method}
Headers: ${JSON.stringify(req.headers)}
Body: ${JSON.stringify(req.body)}
Action extracted: ${action}
----------------------------------------
`;
    fs.appendFileSync(path.join(__dirname, '../debug_work_requests.log'), logData);

    const normalizedAction = action ? action.toLowerCase().trim() : ''; // added trim() just in case
    console.log(`[respondToRequest] ID: ${id}, Action: ${action} (norm: ${normalizedAction}), User: ${req.user.id}`);

    // For accept we must ensure atomic update so two workers can't accept the same request.
    if (normalizedAction === 'accept') {
      const updated = await WorkRequest.findOneAndUpdate(
        { _id: id, status: 'pending' },
        {
          $set: { status: 'accepted', worker: req.user.id, respondedBy: req.user.id, respondedAt: new Date() },
          $push: { responseHistory: { user: req.user.id, action: 'accept', at: new Date() } }
        },
        { new: true }
      ).populate('worker', 'name mobile').populate('respondedBy', 'name mobile').populate('responseHistory.user', 'name mobile');

      if (!updated) return res.status(409).json({ success: false, message: 'Request was already responded to or accepted by another worker' });

      // Notify Owner
      try {
        const { createNotification } = require('../controllers/notificationController');
        await createNotification(
          updated.owner,
          'system',
          'Work Request Accepted',
          `${req.user.name} has accepted your work request: ${updated.title}`,
          { workRequestId: updated._id, workerId: req.user.id }
        );
      } catch (err) {
        console.error('Failed to send work request notification:', err);
      }

      return res.status(200).json({ success: true, data: updated });
    } else if (normalizedAction === 'reject') {
      // Reject if request not already accepted (do not overwrite accepted state)
      const updated = await WorkRequest.findOneAndUpdate(
        { _id: id, status: { $ne: 'accepted' } },
        {
          $set: { status: 'rejected', respondedBy: req.user.id, respondedAt: new Date() },
          $push: { responseHistory: { user: req.user.id, action: 'reject', at: new Date() } }
        },
        { new: true }
      ).populate('respondedBy', 'name mobile').populate('responseHistory.user', 'name mobile');

      if (!updated) return res.status(409).json({ success: false, message: 'Request already accepted and cannot be rejected' });

      return res.status(200).json({ success: true, data: updated });
    } else if (normalizedAction === 'complete') {
      // Mark as completed only if currently accepted by this worker
      const updated = await WorkRequest.findOneAndUpdate(
        { _id: id, status: 'accepted', worker: req.user.id },
        {
          $set: { status: 'completed', respondedBy: req.user.id, respondedAt: new Date() },
          $push: { responseHistory: { user: req.user.id, action: 'complete', at: new Date() } }
        },
        { new: true }
      ).populate('worker', 'name mobile').populate('respondedBy', 'name mobile').populate('responseHistory.user', 'name mobile');

      if (!updated) return res.status(404).json({ success: false, message: 'Request could not be completed (must be accepted by you first)' });

      // Notify Owner
      try {
        const { createNotification } = require('../controllers/notificationController');
        await createNotification(
          updated.owner,
          'system',
          'Work Request Completed',
          `${req.user.name} has completed the work: ${updated.title}`,
          { workRequestId: updated._id, workerId: req.user.id }
        );
      } catch (err) {
        console.error('Failed to send work completion notification:', err);
      }

      return res.status(200).json({ success: true, data: updated });
    } else {
      console.warn(`[respondToRequest] Invalid action received: '${action}'`);
      console.warn(`[respondToRequest] Body was:`, req.body);
      return res.status(400).json({
        success: false,
        message: `Invalid action received: '${action}'. Expected 'accept', 'reject', or 'complete'.`,
        receivedBody: req.body,
        receivedType: typeof action
      });
    }
  } catch (err) {
    console.error('Respond to request error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update request' });
  }
};

// Search registered workers or drivers list (public for owners/farmers)
exports.searchWorkers = async (req, res) => {
  try {
    // simple search by name or location query
    const q = req.query.q || '';
    // Allow filtering by role (worker or driver). Default to worker
    const role = req.query.role || 'worker';

    // Safety check: only allow searching for 'worker' or 'driver'
    if (role !== 'worker' && role !== 'driver') {
      return res.status(400).json({ success: false, message: 'Invalid role search param' });
    }

    const users = await User.find({
      role: role,
      $or: [{ name: { $regex: q, $options: 'i' } }, { location: { $regex: q, $options: 'i' } }]
    }).select('name mobile location rating'); // Added rating if available

    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('Search users error:', err);
    return res.status(500).json({ success: false, message: 'Failed to search users' });
  }
};
