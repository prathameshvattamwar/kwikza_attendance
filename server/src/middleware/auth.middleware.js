const asyncHandler = require('./asyncHandler');
const { verifyAccessToken } = require('../utils/tokenHelper');
const db = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * Authentication middleware
 * Extracts Bearer token, verifies it, loads user + role from DB, attaches to req.user
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // 1. Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Access token is required');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw AppError.unauthorized('Access token is required');
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Access token has expired');
    }
    throw AppError.unauthorized('Invalid access token');
  }

  // 3. Find user in DB with role join
  const user = await db('users')
    .select(
      'users.id',
      'users.email',
      'users.role_id',
      'users.organization_id',
      'users.employee_id',
      'users.first_name',
      'users.last_name',
      'users.is_active',
      'users.is_first_login',
      'roles.name as role'
    )
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .where('users.id', decoded.userId)
    .andWhere('users.is_active', true)
    .first();

  if (!user) {
    throw AppError.unauthorized('User not found or deactivated');
  }

  // 4. Attach user to request
  req.user = user;

  next();
});

module.exports = { authenticate };
