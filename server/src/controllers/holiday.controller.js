const asyncHandler = require('../middleware/asyncHandler');
const holidayService = require('../services/holiday.service');
const { success, created } = require('../utils/response');

/**
 * GET /holidays?year=2026
 * Get holidays for the user's organization
 */
const getHolidays = asyncHandler(async (req, res) => {
  const holidays = await holidayService.getHolidays(req.user.organization_id, req.query);
  return success(res, 'Holidays fetched', holidays);
});

/**
 * POST /holidays
 * Create a new holiday (admin)
 */
const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.createHoliday(req.user.organization_id, req.body);
  return created(res, holiday, 'Holiday created successfully');
});

/**
 * PATCH /holidays/:id
 * Update a holiday (admin)
 */
const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.updateHoliday(
    req.params.id,
    req.user.organization_id,
    req.body
  );
  return success(res, 'Holiday updated', holiday);
});

/**
 * DELETE /holidays/:id
 * Delete a holiday (admin)
 */
const deleteHoliday = asyncHandler(async (req, res) => {
  const result = await holidayService.deleteHoliday(req.params.id, req.user.organization_id);
  return success(res, 'Holiday deleted', result);
});

module.exports = {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
};
