const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenHelper');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const env = require('../config/env');
const UserModel = require('../models/user.model');
const SessionModel = require('../models/session.model');
const db = require('../config/database');

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

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

/**
 * Google OAuth login — verify Google ID token and login/register user
 * @param {string} credential - Google ID token
 * @param {string} ipAddress
 * @param {string} userAgent
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
const googleLogin = async (credential, ipAddress, userAgent) => {
  // 1. Verify Google ID token
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    logger.error('Google token verification failed:', err.message);
    throw AppError.unauthorized('Invalid Google credential');
  }

  const { sub: googleId, email, given_name, family_name, picture, email_verified } = payload;

  if (!email) {
    throw AppError.badRequest('Google account does not have an email address');
  }

  // 2. Find existing user by email
  let user = await UserModel.findByEmail(email);

  if (user) {
    // Existing user — check active status
    if (!user.is_active) {
      throw AppError.unauthorized('Account is deactivated. Contact your administrator.');
    }

    // Update google_id and avatar if not already set
    const updates = {};
    if (!user.google_id) updates.google_id = googleId;
    if (!user.avatar_url && picture) updates.avatar_url = picture;
    if (Object.keys(updates).length > 0) {
      await UserModel.updateById(user.id, updates);
    }
  } else {
    // New user — create with employee role
    const employeeRole = await db('roles').where('name', 'employee').first();
    if (!employeeRole) {
      throw AppError.badRequest('Default employee role not found. Contact administrator.');
    }

    // Find a default organization
    const defaultOrg = await db('organizations').first();
    if (!defaultOrg) {
      throw AppError.badRequest('No organization found. Contact administrator.');
    }

    // Generate a random password (user won't need it for Google login)
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, SALT_ROUNDS);

    // Generate employee ID
    const employeeId = `EMP-${Date.now().toString(36).toUpperCase()}`;

    user = await UserModel.create({
      organization_id: defaultOrg.id,
      role_id: employeeRole.id,
      employee_id: employeeId,
      first_name: given_name || email.split('@')[0],
      last_name: family_name || '',
      email: email.toLowerCase(),
      password_hash: passwordHash,
      google_id: googleId,
      avatar_url: picture || null,
      is_first_login: false,
      is_email_verified: true,
      is_active: true,
    });

    // Re-fetch with role join
    user = await UserModel.findByEmail(email);
  }

  // 3. Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organization_id,
  });

  const refreshToken = generateRefreshToken({ userId: user.id });

  // 4. Store session
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

  // 5. Update last login
  await UserModel.updateLastLogin(user.id);

  logger.info(`User logged in via Google: ${user.email}`);

  // 6. Return sanitized user + tokens
  const { password_hash, ...safeUser } = user;
  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};

module.exports = {
  login,
  refreshToken: refreshTokenFn,
  logout,
  logoutAll,
  setupPassword,
  googleLogin,
};
