const db = require('../config/database');

const LEAVE_TYPES_TABLE = 'leave_types';
const LEAVE_BALANCES_TABLE = 'leave_balances';
const LEAVE_REQUESTS_TABLE = 'leave_requests';

// ─── LEAVE TYPES ─────────────────────────────────────────────────────────────

const findLeaveTypesByOrgId = async (orgId, { activeOnly = true } = {}) => {
  const query = db(LEAVE_TYPES_TABLE).where('organization_id', orgId);
  if (activeOnly) {
    query.andWhere('is_active', true);
  }
  return query.orderBy('name', 'asc');
};

const findLeaveTypeById = async (id) => {
  return db(LEAVE_TYPES_TABLE).where('id', id).first();
};

const createLeaveType = async (data) => {
  const [record] = await db(LEAVE_TYPES_TABLE).insert(data).returning('*');
  return record;
};

const updateLeaveType = async (id, data) => {
  const [record] = await db(LEAVE_TYPES_TABLE)
    .where('id', id)
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return record;
};

// ─── LEAVE BALANCES ──────────────────────────────────────────────────────────

const findBalancesByUserId = async (userId, year) => {
  return db(LEAVE_BALANCES_TABLE)
    .select(
      'leave_balances.*',
      'leave_types.name as leave_type_name',
      'leave_types.is_paid',
      'leave_types.is_carry_forward'
    )
    .join('leave_types', 'leave_balances.leave_type_id', 'leave_types.id')
    .where('leave_balances.user_id', userId)
    .andWhere('leave_balances.year', year)
    .orderBy('leave_types.name', 'asc');
};

const findBalance = async (userId, leaveTypeId, year) => {
  return db(LEAVE_BALANCES_TABLE)
    .where('user_id', userId)
    .andWhere('leave_type_id', leaveTypeId)
    .andWhere('year', year)
    .first();
};

/**
 * Create a leave balance record.
 * IMPORTANT: Do NOT include `remaining_days` — it is a generated column.
 */
const createBalance = async (data) => {
  const [record] = await db(LEAVE_BALANCES_TABLE).insert(data).returning('*');
  return record;
};

const updateBalance = async (id, data) => {
  const [record] = await db(LEAVE_BALANCES_TABLE)
    .where('id', id)
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return record;
};

// ─── LEAVE REQUESTS ──────────────────────────────────────────────────────────

const findRequestById = async (id) => {
  return db(LEAVE_REQUESTS_TABLE)
    .select(
      'leave_requests.*',
      'leave_types.name as leave_type_name',
      'users.first_name',
      'users.last_name',
      'users.email',
      'users.employee_id'
    )
    .join('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
    .join('users', 'leave_requests.user_id', 'users.id')
    .where('leave_requests.id', id)
    .first();
};

const findRequestsByUserId = async (userId, { offset, limit, status, year }) => {
  const query = db(LEAVE_REQUESTS_TABLE)
    .select(
      'leave_requests.*',
      'leave_types.name as leave_type_name'
    )
    .join('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
    .where('leave_requests.user_id', userId)
    .orderBy('leave_requests.applied_at', 'desc');

  if (status) {
    query.andWhere('leave_requests.status', status);
  }
  if (year) {
    query.andWhereRaw('EXTRACT(YEAR FROM leave_requests.start_date) = ?', [year]);
  }

  return query.limit(limit).offset(offset);
};

const countRequestsByUserId = async (userId, { status, year } = {}) => {
  const query = db(LEAVE_REQUESTS_TABLE)
    .where('user_id', userId)
    .count('id as count')
    .first();

  if (status) {
    query.andWhere('status', status);
  }
  if (year) {
    query.andWhereRaw('EXTRACT(YEAR FROM start_date) = ?', [year]);
  }

  const result = await query;
  return parseInt(result.count, 10);
};

const findRequestsByOrgId = async (orgId, { offset, limit, status }) => {
  const query = db(LEAVE_REQUESTS_TABLE)
    .select(
      'leave_requests.*',
      'leave_types.name as leave_type_name',
      'users.first_name',
      'users.last_name',
      'users.email',
      'users.employee_id',
      'users.designation',
      'departments.name as department_name'
    )
    .join('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
    .join('users', 'leave_requests.user_id', 'users.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.organization_id', orgId)
    .orderBy('leave_requests.applied_at', 'desc');

  if (status) {
    query.andWhere('leave_requests.status', status);
  }

  return query.limit(limit).offset(offset);
};

const countRequestsByOrgId = async (orgId, { status } = {}) => {
  const query = db(LEAVE_REQUESTS_TABLE)
    .join('users', 'leave_requests.user_id', 'users.id')
    .where('users.organization_id', orgId)
    .count('leave_requests.id as count')
    .first();

  if (status) {
    query.andWhere('leave_requests.status', status);
  }

  const result = await query;
  return parseInt(result.count, 10);
};

const createRequest = async (data) => {
  const [record] = await db(LEAVE_REQUESTS_TABLE).insert(data).returning('*');
  return record;
};

const updateRequest = async (id, data) => {
  const [record] = await db(LEAVE_REQUESTS_TABLE)
    .where('id', id)
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return record;
};

/**
 * Check for overlapping approved or pending leave requests
 * @param {string} userId
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {string|null} excludeId - Leave request ID to exclude (for edits)
 * @returns {Promise<object|undefined>}
 */
const checkOverlappingLeave = async (userId, startDate, endDate, excludeId = null) => {
  const query = db(LEAVE_REQUESTS_TABLE)
    .where('user_id', userId)
    .whereIn('status', ['pending', 'approved'])
    .andWhere('start_date', '<=', endDate)
    .andWhere('end_date', '>=', startDate);

  if (excludeId) {
    query.andWhereNot('id', excludeId);
  }

  return query.first();
};

module.exports = {
  findLeaveTypesByOrgId,
  findLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  findBalancesByUserId,
  findBalance,
  createBalance,
  updateBalance,
  findRequestById,
  findRequestsByUserId,
  countRequestsByUserId,
  findRequestsByOrgId,
  countRequestsByOrgId,
  createRequest,
  updateRequest,
  checkOverlappingLeave,
};
