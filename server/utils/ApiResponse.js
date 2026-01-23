/**
 * API Response Class
 * Provides a standardized way to send successful API responses
 * 
 * Usage:
 * const ApiResponse = require('../utils/ApiResponse');
 * 
 * // Success response with data
 * return res.status(200).json(new ApiResponse(200, data, "Users fetched successfully"));
 * 
 * // Success response with count
 * return res.status(200).json(new ApiResponse(200, users, "Success", { count: users.length }));
 */

class ApiResponse {
    /**
     * @param {number} statusCode - HTTP status code
     * @param {any} data - Response data
     * @param {string} message - Success message
     * @param {object} meta - Additional metadata (count, pagination, etc.)
     */
    constructor(statusCode, data, message = "Success", meta = {}) {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;

        // Spread any additional metadata
        if (Object.keys(meta).length > 0) {
            Object.assign(this, meta);
        }
    }

    /**
     * Static helper for 200 OK responses
     */
    static ok(data, message = "Success", meta = {}) {
        return new ApiResponse(200, data, message, meta);
    }

    /**
     * Static helper for 201 Created responses
     */
    static created(data, message = "Created successfully", meta = {}) {
        return new ApiResponse(201, data, message, meta);
    }

    /**
     * Static helper for 204 No Content responses
     */
    static noContent(message = "Deleted successfully") {
        return new ApiResponse(204, null, message);
    }
}

module.exports = ApiResponse;
