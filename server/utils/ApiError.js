/**
 * Custom API Error Class
 * Extends the built-in Error class to include status codes and operational flags
 * 
 * Usage:
 * const ApiError = require('../utils/ApiError');
 * 
 * // Throw a 404 error
 * throw new ApiError(404, "User not found");
 * 
 * // Using static helpers
 * throw ApiError.notFound("Equipment not found");
 * throw ApiError.badRequest("Invalid email format");
 * throw ApiError.unauthorized("Please login to continue");
 */

class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {Array} errors - Array of additional error details
     * @param {string} stack - Error stack trace
     */
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.errors = errors;
        this.isOperational = true; // Indicates this is a known operational error

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * 400 Bad Request
     */
    static badRequest(message = "Bad request", errors = []) {
        return new ApiError(400, message, errors);
    }

    /**
     * 401 Unauthorized
     */
    static unauthorized(message = "Unauthorized access") {
        return new ApiError(401, message);
    }

    /**
     * 403 Forbidden
     */
    static forbidden(message = "Access forbidden") {
        return new ApiError(403, message);
    }

    /**
     * 404 Not Found
     */
    static notFound(message = "Resource not found") {
        return new ApiError(404, message);
    }

    /**
     * 409 Conflict
     */
    static conflict(message = "Resource already exists") {
        return new ApiError(409, message);
    }

    /**
     * 422 Unprocessable Entity
     */
    static unprocessable(message = "Unprocessable entity", errors = []) {
        return new ApiError(422, message, errors);
    }

    /**
     * 429 Too Many Requests
     */
    static tooManyRequests(message = "Too many requests, please try again later") {
        return new ApiError(429, message);
    }

    /**
     * 500 Internal Server Error
     */
    static internal(message = "Internal server error") {
        return new ApiError(500, message);
    }
}

module.exports = ApiError;
