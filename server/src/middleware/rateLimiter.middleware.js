const rateLimit = require('express-rate-limit');

/**
 * General rate limiter — 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    errorCode: 'RATE_LIMIT',
  },
});

/**
 * Auth rate limiter — 10 requests per 15 minutes (login, register, etc.)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    errorCode: 'AUTH_RATE_LIMIT',
  },
});

/**
 * API rate limiter — 60 requests per minute
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'API rate limit exceeded, please slow down',
    errorCode: 'API_RATE_LIMIT',
  },
});

module.exports = { generalLimiter, authLimiter, apiLimiter };
