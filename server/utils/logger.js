/**
 * Winston Logger Configuration
 * Provides structured logging with multiple transports
 * 
 * Features:
 * - Console logging with colors
 * - File logging with rotation
 * - Different log levels (error, warn, info, http, debug)
 * - Timestamps and structured format
 * 
 * Usage:
 * const logger = require('../utils/logger');
 * 
 * logger.info('Server started');
 * logger.error('Database connection failed', { error: err.message });
 * logger.debug('Request payload', { body: req.body });
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'cyan'
};

// Add colors to winston
winston.addColors(colors);

// Determine log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'info';
};

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;

        // Add metadata if present
        if (Object.keys(metadata).length > 0) {
            // Don't log stack traces in console for cleaner output
            const { stack, ...rest } = metadata;
            if (Object.keys(rest).length > 0) {
                msg += ` ${JSON.stringify(rest)}`;
            }
        }

        return msg;
    })
);

// Custom format for file output
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Define transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat
    })
];

// Add file transports only if not in test environment
if (process.env.NODE_ENV !== 'test') {
    const logsDir = path.join(__dirname, '..', 'logs');

    // Error log file
    transports.push(
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );

    // Combined log file
    transports.push(
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );
}

// Create the logger instance
const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false
});

// Create a stream object for Morgan integration
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

module.exports = logger;
