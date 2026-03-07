/**
 * Global Express error-handling middleware.
 * Must be registered AFTER all routes.
 */
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const isDev = process.env.NODE_ENV === 'development';

    // Log to console in all environments
    console.error('─── Error ───────────────────────────────────');
    console.error(`  Status  : ${statusCode}`);
    console.error(`  Message : ${err.message}`);
    if (isDev) {
        console.error(`  Stack   : ${err.stack}`);
    }
    console.error('─────────────────────────────────────────────');

    // PostgreSQL unique-violation
    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            message: 'A record with that value already exists.',
            field: err.detail,
        });
    }

    // PostgreSQL foreign-key violation
    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            message: 'Referenced record does not exist.',
            field: err.detail,
        });
    }

    // PostgreSQL not-null violation
    if (err.code === '23502') {
        return res.status(400).json({
            success: false,
            message: `Missing required field: ${err.column || 'unknown'}.`,
        });
    }

    // Validation errors (custom)
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message,
            errors: err.errors || [],
        });
    }

    res.status(statusCode).json({
        success: false,
        message: isDev ? err.message : 'Internal server error.',
        ...(isDev && { stack: err.stack }),
    });
};

/**
 * Utility to create an error with a status code.
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error}
 */
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

module.exports = { errorHandler, createError };
