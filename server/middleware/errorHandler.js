/**
 * Global Error Handler Middleware
 * Catches all errors and sends appropriate JSON responses
 * 
 * Features:
 * - Handles Mongoose validation errors
 * - Handles Mongoose duplicate key errors
 * - Handles Mongoose cast errors (invalid ObjectId)
 * - Handles JWT errors
 * - Handles custom ApiError instances
 * - Differentiates between development and production error responses
 */

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Log error for debugging
    logger.error(`${err.name || 'Error'}: ${err.message}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?.id,
        stack: err.stack
    });

    // Mongoose bad ObjectId (CastError)
    if (err.name === 'CastError') {
        const message = `Resource not found with id: ${err.value}`;
        error = new ApiError(404, message);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
        error = new ApiError(409, message);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        error = new ApiError(400, messages.join(', '), messages);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError(401, 'Invalid token. Please login again.');
    }

    if (err.name === 'TokenExpiredError') {
        error = new ApiError(401, 'Token expired. Please login again.');
    }

    // Multer file upload errors
    if (err.name === 'MulterError') {
        let message = 'File upload error';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File size too large. Maximum size is 10MB.';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files. Maximum is 5 files.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field.';
        }
        error = new ApiError(400, message);
    }

    // Syntax error in JSON body
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        error = new ApiError(400, 'Invalid JSON in request body');
    }

    // Default status code
    const statusCode = error.statusCode || err.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Response object
    const response = {
        success: false,
        message,
        ...(error.errors?.length > 0 && { errors: error.errors })
    };

    // Include stack trace in development mode
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack || err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
