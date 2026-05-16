const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// In development, use very generous limits
const isDev = env.isDev;

/**
 * General rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    errorCode: 'RATE_LIMIT',
  },
});

/**
 * Auth rate limiter
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    errorCode: 'AUTH_RATE_LIMIT',
  },
});

/**
 * API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 500 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'API rate limit exceeded, please slow down',
    errorCode: 'API_RATE_LIMIT',
  },
});

module.exports = { generalLimiter, authLimiter, apiLimiter };
