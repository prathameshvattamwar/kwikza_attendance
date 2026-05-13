const db = require('../config/database');
const AttendanceModel = require('../models/attendance.model');
const AppError = require('../utils/AppError');
const { isWithinRadius } = require('../utils/haversine');
const { ATTENDANCE_STATUS } = require('../config/constants');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

/**
 * Default office start time (HH:MM) used when org has no configured value
 */
const DEFAULT_LATE_THRESHOLD = '09:30';

/**
 * Get the current date string in YYYY-MM-DD format
 * @param {string} [timezone='UTC'] - IANA timezone string
 * @returns {string}
 */
function getTodayDate(timezone = 'UTC') {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

/**
 * Get the current time string in HH:MM format
 * @param {string} [timezone='UTC'] - IANA timezone string
 * @returns {string}
 */
function getCurrentTime(timezone = 'UTC') {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Determine if the check-in time is late based on org settings
 * @param {string} currentTime - HH:MM format
 * @param {string} [threshold] - HH:MM format threshold from org settings
 * @returns {boolean}
 */
function isLate(currentTime, threshold) {
  const limit = threshold || DEFAULT_LATE_THRESHOLD;
  return currentTime > limit;
}

/**
 * Load user with organization details needed for check-in
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getUserWithOrg(userId) {
  const user = await db('users')
    .select(
      'users.id',
      'users.organization_id',
      'users.is_active',
      'organizations.name as org_name',
      'organizations.office_latitude',
      'organizations.office_longitude',
      'organizations.geofence_radius_meters',
      'organizations.timezone',
      'organizations.work_start_time'
    )
    .join('organizations', 'users.organization_id', 'organizations.id')
    .where('users.id', userId)
    .first();

  if (!user) {
    throw AppError.notFound('User or organization not found');
  }

  return user;
}

/**
 * Check if a date is a holiday for the given organization
 * @param {string} orgId - Organization UUID
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<object|undefined>}
 */
async function findHoliday(orgId, date) {
  return db('holidays')
    .where('organization_id', orgId)
    .andWhere('date', date)
    .first();
}

// ─── SERVICE METHODS ─────────────────────────────────────────────────────────

/**
 * Check in for the day
 * @param {string} userId
 * @param {object} params - { latitude, longitude, note, device_info, ip }
 * @returns {Promise<object>} Created attendance record
 */
const checkIn = async (userId, { latitude, longitude, note, device_info, ip }) => {
  // 1. Load user + org
  const user = await getUserWithOrg(userId);
  const timezone = user.timezone || 'UTC';
  const today = getTodayDate(timezone);

  // 2. Validate geolocation
  if (
    user.office_latitude != null &&
    user.office_longitude != null &&
    user.geofence_radius_meters != null
  ) {
    const withinFence = isWithinRadius(
      latitude,
      longitude,
      parseFloat(user.office_latitude),
      parseFloat(user.office_longitude),
      parseFloat(user.geofence_radius_meters)
    );

    if (!withinFence) {
      throw AppError.forbidden('You are not within the office geofence area');
    }
  }

  // 3. Check for duplicate check-in
  const existing = await AttendanceModel.findByUserAndDate(userId, today);
  if (existing) {
    throw AppError.conflict('Already checked in today');
  }

  // 4. Check if today is a holiday
  const holiday = await findHoliday(user.organization_id, today);

  // 5. Determine attendance status
  let status = ATTENDANCE_STATUS.PRESENT;
  if (holiday) {
    status = ATTENDANCE_STATUS.HOLIDAY;
  } else {
    const currentTime = getCurrentTime(timezone);
    const lateThreshold = user.work_start_time || DEFAULT_LATE_THRESHOLD;
    if (isLate(currentTime, lateThreshold)) {
      status = ATTENDANCE_STATUS.LATE;
    }
  }

  // 6. Create the attendance record
  const record = await AttendanceModel.create({
    user_id: userId,
    organization_id: user.organization_id,
    date: today,
    check_in_time: db.fn.now(),
    check_in_latitude: latitude,
    check_in_longitude: longitude,
    check_in_ip: ip || null,
    status,
    note: note || null,
    device_info: device_info ? JSON.stringify(device_info) : null,
    is_manual_entry: false,
  });

  logger.info(`Check-in recorded for user ${userId} with status ${status}`);
  return record;
};

/**
 * Check out for the day
 * @param {string} userId
 * @param {object} params - { latitude, longitude, note, ip }
 * @returns {Promise<object>} Updated attendance record
 */
const checkOut = async (userId, { latitude, longitude, note, ip }) => {
  // 1. Load user + org for timezone
  const user = await getUserWithOrg(userId);
  const timezone = user.timezone || 'UTC';
  const today = getTodayDate(timezone);

  // 2. Find today's record
  const record = await AttendanceModel.findByUserAndDate(userId, today);
  if (!record) {
    throw AppError.badRequest('No check-in found for today');
  }

  // 3. Prevent double check-out
  if (record.check_out_time) {
    throw AppError.conflict('Already checked out today');
  }

  // 4. Calculate work hours for half-day detection
  const checkInTime = new Date(record.check_in_time);
  const now = new Date();
  const workHoursDecimal = (now - checkInTime) / (1000 * 60 * 60);

  // 5. Determine if status should change to half_day
  let statusUpdate = {};
  if (
    workHoursDecimal < 4 &&
    record.status !== ATTENDANCE_STATUS.HOLIDAY &&
    record.status !== ATTENDANCE_STATUS.ON_LEAVE
  ) {
    statusUpdate.status = ATTENDANCE_STATUS.HALF_DAY;
  }

  // 6. Update the record
  const updated = await AttendanceModel.updateById(record.id, {
    check_out_time: db.fn.now(),
    check_out_latitude: latitude,
    check_out_longitude: longitude,
    check_out_ip: ip || null,
    check_out_note: note || null,
    work_hours: parseFloat(workHoursDecimal.toFixed(2)),
    ...statusUpdate,
  });

  logger.info(`Check-out recorded for user ${userId}, work hours: ${workHoursDecimal.toFixed(2)}`);
  return updated;
};

/**
 * Get today's attendance status for a user
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
const getTodayStatus = async (userId) => {
  const user = await getUserWithOrg(userId);
  const timezone = user.timezone || 'UTC';
  const today = getTodayDate(timezone);
  const record = await AttendanceModel.findByUserAndDate(userId, today);
  return record || null;
};

/**
 * Get paginated attendance history for a user
 * @param {string} userId
 * @param {object} query - { page, limit, start_date, end_date, status }
 * @returns {Promise<{ data: object[], pagination: object }>}
 */
const getHistory = async (userId, query) => {
  const { page, limit, offset } = parsePagination(query);

  const filters = {
    startDate: query.start_date,
    endDate: query.end_date,
    status: query.status,
  };

  const [records, total] = await Promise.all([
    AttendanceModel.findByUserId(userId, { offset, limit, ...filters }),
    AttendanceModel.countByUserId(userId, filters),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);
  return { data: records, pagination };
};

/**
 * Get monthly attendance summary for a user
 * @param {string} userId
 * @param {number} month - 1-12
 * @param {number} year
 * @returns {Promise<object>} Summary counts keyed by status
 */
const getMonthlySummary = async (userId, month, year) => {
  const rows = await AttendanceModel.getSummary(userId, month, year);

  // Build a complete summary object with all statuses defaulting to 0
  const summary = {
    present: 0,
    absent: 0,
    late: 0,
    half_day: 0,
    on_leave: 0,
    holiday: 0,
    weekend: 0,
    work_from_home: 0,
  };

  for (const row of rows) {
    summary[row.status] = parseInt(row.count, 10);
  }

  summary.total_working_days = summary.present + summary.late + summary.half_day + summary.work_from_home;
  summary.month = month;
  summary.year = year;

  return summary;
};

/**
 * Admin manual attendance entry or override
 * @param {string} adminId - Admin user ID performing the action
 * @param {object} data - { user_id, date, check_in_time, check_out_time, status, reason }
 * @returns {Promise<object>} Created or updated attendance record
 */
const manualEntry = async (adminId, data) => {
  const { user_id, date, check_in_time, check_out_time, status, reason } = data;

  // Verify the target user exists and belongs to the same org
  const admin = await getUserWithOrg(adminId);
  const targetUser = await db('users')
    .where('id', user_id)
    .andWhere('organization_id', admin.organization_id)
    .first();

  if (!targetUser) {
    throw AppError.notFound('User not found in your organization');
  }

  // Check if a record already exists for this date
  const existing = await AttendanceModel.findByUserAndDate(user_id, date);

  if (existing) {
    // Update the existing record
    const updated = await AttendanceModel.updateById(existing.id, {
      check_in_time,
      check_out_time: check_out_time || null,
      status,
      note: reason,
      is_manual_entry: true,
      manual_entry_by: adminId,
    });

    logger.info(`Manual attendance updated by admin ${adminId} for user ${user_id} on ${date}`);
    return updated;
  }

  // Create new manual entry
  const record = await AttendanceModel.create({
    user_id,
    organization_id: admin.organization_id,
    date,
    check_in_time,
    check_out_time: check_out_time || null,
    status,
    note: reason,
    is_manual_entry: true,
    manual_entry_by: adminId,
  });

  logger.info(`Manual attendance created by admin ${adminId} for user ${user_id} on ${date}`);
  return record;
};

/**
 * Get org-wide attendance overview for today (admin dashboard)
 * @param {string} orgId - Organization UUID
 * @param {object} query - { page, limit }
 * @returns {Promise<{ data: object[], pagination: object, summary: object }>}
 */
const getOrgAttendance = async (orgId, query) => {
  const { page, limit, offset } = parsePagination(query);
  const today = new Date().toISOString().split('T')[0];

  const [{ data, total }, summary] = await Promise.all([
    AttendanceModel.findTodayByOrgId(orgId, { limit, offset }),
    AttendanceModel.getOrgSummary(orgId, today),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);
  return { data, pagination, summary };
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getHistory,
  getMonthlySummary,
  manualEntry,
  getOrgAttendance,
};
