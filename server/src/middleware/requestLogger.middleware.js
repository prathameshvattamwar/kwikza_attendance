const morgan = require('morgan');
const env = require('../config/env');

/**
 * HTTP request logger middleware
 * Uses 'dev' format in development for concise colored output
 * Uses 'combined' format in production for full Apache-style logs
 */
const requestLogger = morgan(env.isDev ? 'dev' : 'combined', {
  skip: (req) => {
    // Skip health check endpoints in production to reduce noise
    if (env.isProd && req.url === '/api/health') {
      return true;
    }
    return false;
  },
});

module.exports = requestLogger;
