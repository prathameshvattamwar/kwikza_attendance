/**
 * Wraps async route handlers to catch rejected promises
 * and forward them to the Express error handler.
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
