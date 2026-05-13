const asyncHandler = require('../middleware/asyncHandler');
const attendanceService = require('../services/attendance.service');
const { success, created, paginated } = require('../utils/response');

/**
 * Extract client IP from request (handles proxied requests)
 * @param {object} req - Express request
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for may contain a comma-separated list; take the first
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress;
}

/**
 * POST /attendance/check-in
 * Record employee check-in
 */
const checkIn = asyncHandler(async (req, res) => {
  const { latitude, longitude, note, device_info } = req.body;
  const ip = getClientIp(req);

  const record = await attendanceService.checkIn(req.user.id, {
    latitude,
    longitude,
    note,
    device_info,
    ip,
  });

  return created(res, record, 'Checked in successfully');
});

/**
 * POST /attendance/check-out
 * Record employee check-out
 */
const checkOut = asyncHandler(async (req, res) => {
  const { latitude, longitude, note } = req.body;
  const ip = getClientIp(req);

  const record = await attendanceService.checkOut(req.user.id, {
    latitude,
    longitude,
    note,
    ip,
  });

  return success(res, record, 'Checked out successfully');
});

/**
 * GET /attendance/today
 * Get today's attendance status for the authenticated user
 */
const getTodayStatus = asyncHandler(async (req, res) => {
  const record = await attendanceService.getTodayStatus(req.user.id);
  return success(res, record, 'Today\'s attendance status');
});

/**
 * GET /attendance/history
 * Get paginated attendance history for the authenticated user
 */
const getHistory = asyncHandler(async (req, res) => {
  const { data, pagination } = await attendanceService.getHistory(req.user.id, req.query);
  return paginated(res, data, pagination, 'Attendance history fetched');
});

/**
 * GET /attendance/summary/:year/:month
 * Get monthly attendance summary for the authenticated user
 */
const getMonthlySummary = asyncHandler(async (req, res) => {
  const month = parseInt(req.params.month, 10);
  const year = parseInt(req.params.year, 10);

  if (!month || month < 1 || month > 12 || !year || year < 2000) {
    const AppError = require('../utils/AppError');
    throw AppError.badRequest('Invalid month or year');
  }

  const summary = await attendanceService.getMonthlySummary(req.user.id, month, year);
  return success(res, summary, 'Monthly summary fetched');
});

/**
 * POST /attendance/manual
 * Admin creates or overrides an attendance entry
 */
const manualEntry = asyncHandler(async (req, res) => {
  const record = await attendanceService.manualEntry(req.user.id, req.body);
  return created(res, record, 'Manual attendance entry created');
});

/**
 * GET /attendance/org-overview
 * Admin view of today's org-wide attendance
 */
const getOrgAttendance = asyncHandler(async (req, res) => {
  const { data, pagination, summary } = await attendanceService.getOrgAttendance(
    req.user.organization_id,
    req.query
  );

  return paginated(res, { records: data, summary }, pagination, 'Organization attendance fetched');
});

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getHistory,
  getMonthlySummary,
  manualEntry,
  getOrgAttendance,
};
