const db = require('../config/database');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * Get attendance report for a date range
 * @param {string} orgId - Organization UUID
 * @param {object} options - { start_date, end_date, page, limit }
 * @returns {Promise<{ data: object[], pagination: object }>}
 */
const getAttendanceReport = async (orgId, options = {}) => {
  const { start_date, end_date } = options;
  const { page, limit, offset } = parsePagination(options);

  const query = db('attendance_records')
    .select(
      'attendance_records.id',
      'attendance_records.date',
      'attendance_records.check_in',
      'attendance_records.check_out',
      'attendance_records.status',
      'attendance_records.work_hours',
      'users.first_name',
      'users.last_name',
      'users.email',
      'users.employee_id',
      'departments.name as department_name'
    )
    .leftJoin('users', 'attendance_records.user_id', 'users.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.organization_id', orgId);

  if (start_date) {
    query.andWhere('attendance_records.date', '>=', start_date);
  }
  if (end_date) {
    query.andWhere('attendance_records.date', '<=', end_date);
  }

  const countQuery = query.clone().clearSelect().clearOrder().count('attendance_records.id as count').first();
  const { count: total } = await countQuery;

  const data = await query
    .orderBy('attendance_records.date', 'desc')
    .orderBy('users.first_name', 'asc')
    .limit(limit)
    .offset(offset);

  return { data, pagination: buildPaginationMeta(parseInt(total, 10), page, limit) };
};

/**
 * Get leave report for a date range
 * @param {string} orgId - Organization UUID
 * @param {object} options - { start_date, end_date, page, limit }
 * @returns {Promise<{ data: object[], pagination: object }>}
 */
const getLeaveReport = async (orgId, options = {}) => {
  const { start_date, end_date } = options;
  const { page, limit, offset } = parsePagination(options);

  const query = db('leave_requests')
    .select(
      'leave_requests.id',
      'leave_requests.start_date',
      'leave_requests.end_date',
      'leave_requests.total_days',
      'leave_requests.status',
      'leave_requests.reason',
      'leave_requests.created_at',
      'users.first_name',
      'users.last_name',
      'users.email',
      'users.employee_id',
      'leave_types.name as leave_type_name',
      'departments.name as department_name'
    )
    .leftJoin('users', 'leave_requests.user_id', 'users.id')
    .leftJoin('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.organization_id', orgId);

  if (start_date) {
    query.andWhere('leave_requests.start_date', '>=', start_date);
  }
  if (end_date) {
    query.andWhere('leave_requests.end_date', '<=', end_date);
  }

  const countQuery = query.clone().clearSelect().clearOrder().count('leave_requests.id as count').first();
  const { count: total } = await countQuery;

  const data = await query
    .orderBy('leave_requests.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return { data, pagination: buildPaginationMeta(parseInt(total, 10), page, limit) };
};

/**
 * Get employee directory report
 * @param {string} orgId - Organization UUID
 * @param {object} options - { page, limit }
 * @returns {Promise<{ data: object[], pagination: object }>}
 */
const getEmployeeReport = async (orgId, options = {}) => {
  const { page, limit, offset } = parsePagination(options);

  const query = db('users')
    .select(
      'users.id',
      'users.employee_id',
      'users.first_name',
      'users.last_name',
      'users.email',
      'users.phone',
      'users.designation',
      'users.date_of_joining',
      'users.is_active',
      'roles.name as role',
      'departments.name as department_name'
    )
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.organization_id', orgId);

  const countQuery = query.clone().clearSelect().clearOrder().count('users.id as count').first();
  const { count: total } = await countQuery;

  const data = await query
    .orderBy('users.first_name', 'asc')
    .limit(limit)
    .offset(offset);

  return { data, pagination: buildPaginationMeta(parseInt(total, 10), page, limit) };
};

/**
 * Get full attendance data for CSV export (no pagination)
 * @param {string} orgId
 * @param {object} options - { start_date, end_date }
 * @returns {Promise<object[]>}
 */
const getAttendanceExport = async (orgId, options = {}) => {
  const { start_date, end_date } = options;

  const query = db('attendance_records')
    .select(
      'users.employee_id',
      'users.first_name',
      'users.last_name',
      'users.email',
      'departments.name as department',
      'attendance_records.date',
      'attendance_records.check_in',
      'attendance_records.check_out',
      'attendance_records.status',
      'attendance_records.work_hours'
    )
    .leftJoin('users', 'attendance_records.user_id', 'users.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.organization_id', orgId);

  if (start_date) query.andWhere('attendance_records.date', '>=', start_date);
  if (end_date) query.andWhere('attendance_records.date', '<=', end_date);

  return query.orderBy('attendance_records.date', 'desc').orderBy('users.first_name', 'asc');
};

/**
 * Get full leave data for CSV export (no pagination)
 * @param {string} orgId
 * @param {object} options - { start_date, end_date }
 * @returns {Promise<object[]>}
 */
const getLeaveExport = async (orgId, options = {}) => {
  const { start_date, end_date } = options;

  const query = db('leave_requests')
    .select(
      'users.employee_id',
      'users.first_name',
      'users.last_name',
      'users.email',
      'departments.name as department',
      'leave_types.name as leave_type',
      'leave_requests.start_date',
      'leave_requests.end_date',
      'leave_requests.total_days',
      'leave_requests.status',
      'leave_requests.reason',
      'leave_requests.created_at'
    )
    .leftJoin('users', 'leave_requests.user_id', 'users.id')
    .leftJoin('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.organization_id', orgId);

  if (start_date) query.andWhere('leave_requests.start_date', '>=', start_date);
  if (end_date) query.andWhere('leave_requests.end_date', '<=', end_date);

  return query.orderBy('leave_requests.created_at', 'desc');
};

/**
 * Get full employee data for CSV export (no pagination)
 * @param {string} orgId
 * @returns {Promise<object[]>}
 */
const getEmployeeExport = async (orgId) => {
  return db('users')
    .select(
      'users.employee_id',
      'users.first_name',
      'users.last_name',
      'users.email',
      'users.phone',
      'users.designation',
      'users.date_of_joining',
      'users.is_active',
      'roles.name as role',
      'departments.name as department'
    )
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.organization_id', orgId)
    .orderBy('users.first_name', 'asc');
};

module.exports = {
  getAttendanceReport,
  getLeaveReport,
  getEmployeeReport,
  getAttendanceExport,
  getLeaveExport,
  getEmployeeExport,
};
