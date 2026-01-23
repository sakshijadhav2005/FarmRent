/**
 * Async Handler Utility
 * Wraps async route handlers to automatically catch errors
 * and pass them to the error handling middleware
 * 
 * Usage:
 * const asyncHandler = require('../utils/asyncHandler');
 * 
 * exports.getUsers = asyncHandler(async (req, res, next) => {
 *     const users = await User.find();
 *     res.status(200).json({ success: true, data: users });
 * });
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
