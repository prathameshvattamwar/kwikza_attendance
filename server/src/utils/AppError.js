/**
 * Custom application error class for operational errors
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [errorCode] - Application-specific error code
   */
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errorCode = 'BAD_REQUEST') {
    return new AppError(message, 400, errorCode);
  }

  static unauthorized(
    message = 'Unauthorized',
    errorCode = 'UNAUTHORIZED'
  ) {
    return new AppError(message, 401, errorCode);
  }

  static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    return new AppError(message, 403, errorCode);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    return new AppError(message, 404, errorCode);
  }

  static conflict(
    message = 'Resource already exists',
    errorCode = 'CONFLICT'
  ) {
    return new AppError(message, 409, errorCode);
  }

  static internal(
    message = 'Internal server error',
    errorCode = 'INTERNAL_ERROR'
  ) {
    return new AppError(message, 500, errorCode);
  }

  static tooManyRequests(
    message = 'Too many requests, please try again later',
    errorCode = 'RATE_LIMIT'
  ) {
    return new AppError(message, 429, errorCode);
  }
}

module.exports = AppError;
