const HolidayModel = require('../models/holiday.model');
const AppError = require('../utils/AppError');

/**
 * Get holidays for an organization, optionally filtered by year
 */
const getHolidays = async (orgId, query) => {
  const year = query.year ? parseInt(query.year, 10) : undefined;
  return HolidayModel.findByOrgId(orgId, { year, activeOnly: true });
};

/**
 * Create a new holiday
 */
const createHoliday = async (orgId, data) => {
  return HolidayModel.create({
    organization_id: orgId,
    name: data.name,
    date: data.date,
    type: data.type,
    description: data.description || null,
    is_active: true,
  });
};

/**
 * Update a holiday (verify it belongs to the org)
 */
const updateHoliday = async (id, orgId, data) => {
  const holiday = await HolidayModel.findById(id);

  if (!holiday) {
    throw AppError.notFound('Holiday not found');
  }

  if (holiday.organization_id !== orgId) {
    throw AppError.forbidden('Holiday does not belong to your organization');
  }

  return HolidayModel.updateById(id, data);
};

/**
 * Delete a holiday (verify it belongs to the org)
 */
const deleteHoliday = async (id, orgId) => {
  const holiday = await HolidayModel.findById(id);

  if (!holiday) {
    throw AppError.notFound('Holiday not found');
  }

  if (holiday.organization_id !== orgId) {
    throw AppError.forbidden('Holiday does not belong to your organization');
  }

  await HolidayModel.deleteById(id);
  return { id };
};

module.exports = {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
};
