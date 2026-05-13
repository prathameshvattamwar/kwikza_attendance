const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate a short-lived access token
 * @param {object} payload - Data to encode (e.g. { id, email, role })
 * @returns {string} Signed JWT
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
}

/**
 * Generate a long-lived refresh token
 * @param {object} payload - Data to encode (e.g. { id, tokenVersion })
 * @returns {string} Signed JWT
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
}

/**
 * Verify and decode an access token
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/**
 * Verify and decode a refresh token
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
