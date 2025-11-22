const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sams-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// In production, we'd also add file transports
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

/**
 * Unified error response format
 * @param {Object} res - Express response object
 * @param {Object} error - Error object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
function sendErrorResponse(res, error, statusCode, message) {
  // Log the error with context
  logger.error({
    message: error.message || message,
    stack: error.stack,
    statusCode,
    url: res.req ? res.req.url : 'unknown',
    method: res.req ? res.req.method : 'unknown',
    ip: res.req ? res.req.ip : 'unknown'
  });

  // Determine if we should include stack trace in response
  const includeStack = process.env.NODE_ENV !== 'production';

  // Send the response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(includeStack && error.stack ? { stack: error.stack } : {}),
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle Mongoose validation errors
 * @param {Object} err - Mongoose validation error
 * @returns {Object} Formatted error object
 */
function handleValidationError(err) {
  const errors = Object.values(err.errors).map(e => e.message);
  return {
    message: 'Validation Error',
    details: errors
  };
}

/**
 * Handle Mongoose duplicate key errors
 * @param {Object} err - Duplicate key error
 * @returns {Object} Formatted error object
 */
function handleDuplicateKeyError(err) {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return {
    message: `Duplicate value for field: ${field}`,
    details: [`The value '${value}' already exists for field '${field}'`]
  };
}

/**
 * Handle Mongoose cast errors (e.g., invalid ObjectId)
 * @param {Object} err - Cast error
 * @returns {Object} Formatted error object
 */
function handleCastError(err) {
  return {
    message: 'Invalid ID format',
    details: [`Invalid ${err.path}: ${err.value}`]
  };
}

/**
 * Handle JWT errors
 * @param {Object} err - JWT error
 * @returns {Object} Formatted error object
 */
function handleJWTError(err) {
  return {
    message: 'Invalid token',
    details: ['Please provide a valid authentication token']
  };
}

/**
 * Handle JWT expiration errors
 * @param {Object} err - JWT expiration error
 * @returns {Object} Formatted error object
 */
function handleJWTExpiredError(err) {
  return {
    message: 'Token has expired',
    details: ['Please log in again to obtain a new token']
  };
}

/**
 * Central error handling middleware
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function globalErrorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Operational errors (trusted errors)
  if (err.isOperational) {
    sendErrorResponse(res, err, err.statusCode, err.message);
  }
  // Programming errors (unknown errors)
  else {
    // For development, send detailed error
    if (process.env.NODE_ENV === 'development') {
      sendErrorResponse(res, err, err.statusCode, err.message);
    }
    // For production, send generic error
    else {
      sendErrorResponse(res, err, 500, 'Something went wrong!');
    }
  }
}

module.exports = {
  logger,
  sendErrorResponse,
  handleValidationError,
  handleDuplicateKeyError,
  handleCastError,
  handleJWTError,
  handleJWTExpiredError,
  globalErrorHandler
};