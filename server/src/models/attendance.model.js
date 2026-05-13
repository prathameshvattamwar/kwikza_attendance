const db = require('../config/database');

const TABLE = 'attendance_records';

/**
 * Find an attendance record for a user on a specific date
 * @param {string} userId - User UUID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<object|undefined>}
 */
const findByUserAndDate = async (userId, date) => {
  return db(TABLE)
    .where('user_id', userId)
    .andWhereRaw('DATE(date) = ?', [date])
    .first();
};

/**
 * Create a new attendance record
 * @param {object} data - Attendance record data
 * @returns {Promise<object>} The created record
 */
const create = async (data) => {
  const [record] = await db(TABLE).insert(data).returning('*');
  return record;
};

/**
 * Update an attendance record by ID
 * @param {string} id - Record UUID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} The updated record
 */
const updateById = async (id, data) => {
  const [record] = await db(TABLE)
    .where('id', id)
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return record;
};

/**
 * Find attendance records for a user with pagination and filters
 * @param {string} userId - User UUID
 * @param {object} options - { page, limit, offset, startDate, endDate, status }
 * @returns {Promise<object[]>}
 */
const findByUserId = async (userId, { offset, limit, startDate, endDate, status }) => {
  const query = db(TABLE)
    .where('user_id', userId)
    .orderBy('date', 'desc');

  if (startDate) {
    query.andWhere('date', '>=', startDate);
  }
  if (endDate) {
    query.andWhere('date', '<=', endDate);
  }
  if (status) {
    query.andWhere('status', status);
  }

  return query.limit(limit).offset(offset);
};

/**
 * Count attendance records for a user with filters (for pagination)
 * @param {string} userId - User UUID
 * @param {object} filters - { startDate, endDate, status }
 * @returns {Promise<number>}
 */
const countByUserId = async (userId, { startDate, endDate, status } = {}) => {
  const query = db(TABLE).where('user_id', userId).count('id as count').first();

  if (startDate) {
    query.andWhere('date', '>=', startDate);
  }
  if (endDate) {
    query.andWhere('date', '<=', endDate);
  }
  if (status) {
    query.andWhere('status', status);
  }

  const result = await query;
  return parseInt(result.count, 10);
};

/**
 * Find today's attendance for all users in an organization (admin view)
 * @param {string} orgId - Organization UUID
 * @param {object} options - { limit, offset }
 * @returns {Promise<{ data: object[], total: number }>}
 */
const findTodayByOrgId = async (orgId, { limit, offset }) => {
  const today = new Date().toISOString().split('T')[0];

  const baseQuery = db(TABLE)
    .join('users', 'attendance_records.user_id', 'users.id')
    .where('users.organization_id', orgId)
    .andWhereRaw('DATE(attendance_records.date) = ?', [today]);

  // Count
  const countResult = await baseQuery.clone()
    .clearSelect()
    .clearOrder()
    .count('attendance_records.id as count')
    .first();

  const total = parseInt(countResult.count, 10);

  // Data
  const data = await baseQuery.clone()
    .select(
      'attendance_records.*',
      'users.first_name',
      'users.last_name',
      'users.email',
      'users.employee_id',
      'users.designation'
    )
    .orderBy('attendance_records.check_in_time', 'desc')
    .limit(limit)
    .offset(offset);

  return { data, total };
};

/**
 * Get monthly attendance summary counts by status for a user
 * @param {string} userId - User UUID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g. 2026)
 * @returns {Promise<object[]>} Array of { status, count }
 */
const getSummary = async (userId, month, year) => {
  return db(TABLE)
    .select('status')
    .count('id as count')
    .where('user_id', userId)
    .andWhereRaw('EXTRACT(MONTH FROM date) = ?', [month])
    .andWhereRaw('EXTRACT(YEAR FROM date) = ?', [year])
    .groupBy('status');
};

/**
 * Get org-wide attendance summary for a given date (dashboard)
 * @param {string} orgId - Organization UUID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<object>} { total_employees, present, absent, on_leave, late, half_day }
 */
const getOrgSummary = async (orgId, date) => {
  // Total active employees in org
  const totalResult = await db('users')
    .where('organization_id', orgId)
    .andWhere('is_active', true)
    .count('id as count')
    .first();
  const totalEmployees = parseInt(totalResult.count, 10);

  // Attendance counts by status for the date
  const statusCounts = await db(TABLE)
    .select('status')
    .count('id as count')
    .join('users', 'attendance_records.user_id', 'users.id')
    .where('users.organization_id', orgId)
    .andWhereRaw('DATE(attendance_records.date) = ?', [date])
    .groupBy('status');

  const counts = {};
  for (const row of statusCounts) {
    counts[row.status] = parseInt(row.count, 10);
  }

  return {
    total_employees: totalEmployees,
    present: counts.present || 0,
    absent: counts.absent || 0,
    late: counts.late || 0,
    half_day: counts.half_day || 0,
    on_leave: counts.on_leave || 0,
    holiday: counts.holiday || 0,
    weekend: counts.weekend || 0,
  };
};

module.exports = {
  findByUserAndDate,
  create,
  updateById,
  findByUserId,
  countByUserId,
  findTodayByOrgId,
  getSummary,
  getOrgSummary,
};
