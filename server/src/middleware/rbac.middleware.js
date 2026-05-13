const AppError = require('../utils/AppError');

/**
 * Role-based authorization middleware
 * Checks if the authenticated user's role is in the allowedRoles array
 * @param  {...string} allowedRoles - Role names that are permitted
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!req.user.role) {
      throw AppError.forbidden('User role not found');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * Checks if the authenticated user has the specified permission
 * @param {string} permissionKey - The permission key to check
 */
const hasPermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!req.user.permissions || !req.user.permissions[permissionKey]) {
      throw AppError.forbidden(
        `Access denied. Required permission: ${permissionKey}`
      );
    }

    next();
  };
};

module.exports = { authorize, hasPermission };
