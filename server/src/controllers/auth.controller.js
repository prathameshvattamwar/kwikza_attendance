const asyncHandler = require('../middleware/asyncHandler');
const authService = require('../services/auth.service');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const UserModel = require('../models/user.model');
const AppError = require('../utils/AppError');
const { success, created } = require('../utils/response');
const { logAudit } = require('../utils/auditHelper');

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  const result = await authService.login(email, password, ipAddress, userAgent);

  // Set refresh token as httpOnly cookie
  res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  logAudit({
    userId: result.user.id,
    orgId: result.user.organization_id,
    action: 'login',
    entityType: 'user',
    entityId: result.user.id,
    ipAddress: ipAddress,
    userAgent: userAgent,
  });

  return success(res, 'Login successful', {
    user: result.user,
    accessToken: result.accessToken,
  });
});

/**
 * POST /auth/refresh-token
 * Issue new token pair using refresh token
 */
const refreshToken = asyncHandler(async (req, res) => {
  // Read refresh token from cookie first, then fall back to body
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refresh_token;

  if (!token) {
    throw AppError.badRequest('Refresh token is required');
  }

  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  const result = await authService.refreshToken(token, ipAddress, userAgent);

  // Set new refresh token cookie
  res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return success(res, 'Token refreshed', {
    accessToken: result.accessToken,
  });
});

/**
 * POST /auth/logout
 * Revoke the current session
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refresh_token;

  await authService.logout(req.user.id, token);

  // Clear the refresh token cookie
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  logAudit({
    userId: req.user.id,
    orgId: req.user.organization_id,
    action: 'logout',
    entityType: 'user',
    entityId: req.user.id,
  });

  return success(res, 'Logged out successfully');
});

/**
 * POST /auth/logout-all
 * Revoke all sessions for the authenticated user
 */
const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);

  // Clear the refresh token cookie
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return success(res, 'Logged out from all devices');
});

/**
 * POST /auth/setup-password
 * Change password on first login
 */
const setupPassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  await authService.setupPassword(req.user.id, current_password, new_password);

  return success(res, 'Password updated successfully');
});

/**
 * POST /auth/send-otp
 * Generate and send OTP to user's email
 */
const sendOtp = asyncHandler(async (req, res) => {
  const { email, purpose = 'email_verification' } = req.body;

  if (!email) {
    throw AppError.badRequest('Email is required');
  }

  const user = await UserModel.findByEmail(email);
  if (!user) {
    // Don't reveal whether user exists — return success either way
    return success(res, 'If the email is registered, an OTP has been sent.');
  }

  const otp = await otpService.createOtp(user.id, email, purpose);
  await emailService.sendOtpEmail(email, otp, purpose);

  return success(res, 'OTP sent to your email');
});

/**
 * POST /auth/verify-otp
 * Verify OTP and mark email as verified
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const purpose = req.body.purpose || 'email_verification';

  const result = await otpService.verifyOtp(email, otp, purpose);

  if (!result.success) {
    throw AppError.badRequest(result.message);
  }

  // Mark user email as verified if purpose is email_verification
  if (purpose === 'email_verification') {
    const user = await UserModel.findByEmail(email);
    if (user) {
      await UserModel.updateById(user.id, { is_email_verified: true });
    }
  }

  return success(res, result.message);
});

/**
 * POST /auth/google
 * Authenticate user via Google OAuth
 */
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw AppError.badRequest('Google credential is required');
  }

  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  const result = await authService.googleLogin(credential, ipAddress, userAgent);

  // Set refresh token as httpOnly cookie
  res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return success(res, 'Login successful', {
    user: result.user,
    accessToken: result.accessToken,
  });
});

/**
 * PATCH /auth/profile
 * Update the authenticated user's profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['first_name', 'last_name', 'phone', 'date_of_birth'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw AppError.badRequest('No valid fields to update');
  }

  const updatedUser = await UserModel.updateById(req.user.id, updates);
  const { password_hash, ...profile } = updatedUser;

  return success(res, 'Profile updated successfully', profile);
});

/**
 * GET /auth/me
 * Return the authenticated user's profile
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Remove sensitive fields
  const { password_hash, ...profile } = user;

  return success(res, 'Profile fetched', profile);
});

module.exports = {
  login,
  refreshToken,
  logout,
  logoutAll,
  setupPassword,
  sendOtp,
  verifyOtp,
  getMe,
  updateProfile,
  googleLogin,
};
