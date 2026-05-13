const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenHelper');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const UserModel = require('../models/user.model');
const SessionModel = require('../models/session.model');

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

/**
 * Hash a refresh token with SHA-256 for secure storage
 * @param {string} token
 * @returns {string}
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @param {string} ipAddress
 * @param {string} userAgent
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
const login = async (email, password, ipAddress, userAgent) => {
  // 1. Find user by email
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // 2. Check if user is active
  if (!user.is_active) {
    throw AppError.unauthorized('Account is deactivated. Contact your administrator.');
  }

  // 3. Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // 4. Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organization_id,
  });

  const refreshToken = generateRefreshToken({ userId: user.id });

  // 5. Store session with hashed refresh token
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await SessionModel.create({
    user_id: user.id,
    refresh_token_hash: refreshTokenHash,
    ip_address: ipAddress,
    user_agent: userAgent,
    expires_at: expiresAt,
  });

  // 6. Update last login
  await UserModel.updateLastLogin(user.id);

  logger.info(`User logged in: ${user.email}`);

  // 7. Return sanitized user + tokens
  const { password_hash, ...safeUser } = user;
  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh token rotation — issue new pair, revoke old session
 * @param {string} token - The current refresh token
 * @param {string} ipAddress
 * @param {string} userAgent
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const refreshTokenFn = async (token, ipAddress, userAgent) => {
  // 1. Verify the refresh token JWT
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  // 2. Find the session by user + hashed token
  const tokenHash = hashToken(token);
  const session = await SessionModel.findByUserIdAndToken(decoded.userId, tokenHash);

  if (!session) {
    // Possible token reuse attack — revoke all sessions for safety
    logger.warn(`Refresh token reuse detected for user: ${decoded.userId}`);
    await SessionModel.revokeAllByUserId(decoded.userId);
    throw AppError.unauthorized('Invalid refresh token. All sessions revoked for security.');
  }

  // 3. Revoke the old session
  await SessionModel.revokeById(session.id);

  // 4. Load user
  const user = await UserModel.findById(decoded.userId);
  if (!user || !user.is_active) {
    throw AppError.unauthorized('User not found or deactivated');
  }

  // 5. Generate new token pair
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organization_id,
  });

  const newRefreshToken = generateRefreshToken({ userId: user.id });

  // 6. Store new session
  const newRefreshTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await SessionModel.create({
    user_id: user.id,
    refresh_token_hash: newRefreshTokenHash,
    ip_address: ipAddress,
    user_agent: userAgent,
    expires_at: expiresAt,
  });

  logger.info(`Token refreshed for user: ${user.email}`);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout — revoke a single session
 * @param {string} userId
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
const logout = async (userId, refreshToken) => {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    const session = await SessionModel.findByUserIdAndToken(userId, tokenHash);
    if (session) {
      await SessionModel.revokeById(session.id);
    }
  }
  logger.info(`User logged out: ${userId}`);
};

/**
 * Logout from all devices — revoke all sessions
 * @param {string} userId
 * @returns {Promise<void>}
 */
const logoutAll = async (userId) => {
  await SessionModel.revokeAllByUserId(userId);
  logger.info(`All sessions revoked for user: ${userId}`);
};

/**
 * Setup password (first-time login)
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const setupPassword = async (userId, currentPassword, newPassword) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw AppError.badRequest('Current password is incorrect');
  }

  // Hash and save new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await UserModel.updatePassword(userId, hashedPassword);

  // Mark first login as complete
  await UserModel.updateById(userId, { is_first_login: false });

  logger.info(`Password setup completed for user: ${userId}`);
};

module.exports = {
  login,
  refreshToken: refreshTokenFn,
  logout,
  logoutAll,
  setupPassword,
};
