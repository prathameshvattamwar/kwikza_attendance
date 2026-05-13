const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Handle Zod validation errors
 */
function handleZodError(err) {
  const fieldErrors = err.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
  const message = 'Validation failed';
  const error = new AppError(message, 400, 'VALIDATION_ERROR');
  error.fieldErrors = fieldErrors;
  return error;
}

/**
 * Handle JWT TokenExpiredError
 */
function handleJWTExpiredError() {
  return new AppError('Token has expired, please log in again', 401, 'TOKEN_EXPIRED');
}

/**
 * Handle JWT JsonWebTokenError
 */
function handleJWTError() {
  return new AppError('Invalid token, please log in again', 401, 'INVALID_TOKEN');
}

/**
 * Handle PostgreSQL unique violation (23505)
 */
function handleUniqueViolation(err) {
  const detail = err.detail || '';
  const match = detail.match(/Key \((.+?)\)=/);
  const field = match ? match[1] : 'field';
  return new AppError(
    `A record with this ${field} already exists`,
    409,
    'DUPLICATE_ENTRY'
  );
}

/**
 * Handle PostgreSQL foreign key violation (23503)
 */
function handleFKViolation(err) {
  const detail = err.detail || '';
  return new AppError(
    `Referenced resource does not exist: ${detail}`,
    400,
    'FK_VIOLATION'
  );
}

/**
 * Send error response in development (with stack trace)
 */
function sendDevError(err, res) {
  const response = {
    success: false,
    status: err.status || 'error',
    message: err.message,
    errorCode: err.errorCode || null,
    stack: err.stack,
  };
  if (err.fieldErrors) {
    response.fieldErrors = err.fieldErrors;
  }
  res.status(err.statusCode || 500).json(response);
}

/**
 * Send error response in production (no sensitive info)
 */
function sendProdError(err, res) {
  if (err.isOperational) {
    const response = {
      success: false,
      status: err.status,
      message: err.message,
      errorCode: err.errorCode || null,
    };
    if (err.fieldErrors) {
      response.fieldErrors = err.fieldErrors;
    }
    return res.status(err.statusCode).json(response);
  }

  // Unknown / programming errors -- don't leak details
  logger.error('UNEXPECTED ERROR:', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Something went wrong',
  });
}

/**
 * Global error handling middleware
 * Must have 4 parameters for Express to recognise it as an error handler
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`);

  if (env.isDev) {
    return sendDevError(err, res);
  }

  // Clone so we don't mutate the original
  let error = { ...err, message: err.message, stack: err.stack };

  // Zod validation error
  if (err.name === 'ZodError') {
    error = handleZodError(err);
  }

  // JWT errors
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    error = handleUniqueViolation(err);
  }
  if (err.code === '23503') {
    error = handleFKViolation(err);
  }

  return sendProdError(error, res);
}

module.exports = errorHandler;
