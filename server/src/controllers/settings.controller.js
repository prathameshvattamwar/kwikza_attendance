const asyncHandler = require('../middleware/asyncHandler');
const db = require('../config/database');
const AppError = require('../utils/AppError');
const { success } = require('../utils/response');

/**
 * GET /settings
 * Get organization settings for the authenticated user's org
 */
const getSettings = asyncHandler(async (req, res) => {
  const org = await db('organizations')
    .where('id', req.user.organization_id)
    .first();

  if (!org) {
    throw AppError.notFound('Organization not found');
  }

  return success(res, 'Settings fetched successfully', org);
});

/**
 * PATCH /settings
 * Update organization settings
 */
const updateSettings = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'address',
    'city',
    'state',
    'country',
    'zip_code',
    'phone',
    'email',
    'logo_url',
    'office_latitude',
    'office_longitude',
    'geofence_radius_meters',
    'timezone',
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw AppError.badRequest('No valid fields to update');
  }

  const [org] = await db('organizations')
    .where('id', req.user.organization_id)
    .update({ ...updates, updated_at: db.fn.now() })
    .returning('*');

  return success(res, 'Settings updated successfully', org);
});

module.exports = { getSettings, updateSettings };
