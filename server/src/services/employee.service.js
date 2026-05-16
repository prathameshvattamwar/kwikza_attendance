const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const UserModel = require('../models/user.model');
const DepartmentModel = require('../models/department.model');
const AuditLogModel = require('../models/auditLog.model');
const emailService = require('./email.service');
const AppError = require('../utils/AppError');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

const BCRYPT_ROUNDS = 12;

/**
 * Create a new employee
 * @param {object} adminUser - The authenticated admin user (req.user)
 * @param {object} employeeData - Validated employee data from request body
 * @returns {Promise<object>} Created employee (without password_hash)
 */
const createEmployee = async (adminUser, employeeData) => {
  // Check if email already exists
  const existingUser = await UserModel.findByEmail(employeeData.email);
  if (existingUser) {
    throw AppError.conflict('A user with this email already exists');
  }

  // Check if employee_id already exists in the org
  const existingEmpId = await db('users')
    .where('employee_id', employeeData.employee_id)
    .andWhere('organization_id', adminUser.organization_id)
    .first();
  if (existingEmpId) {
    throw AppError.conflict('An employee with this Employee ID already exists in this organization');
  }

  // Generate temporary password
  const tempPassword = crypto.randomBytes(4).toString('hex');
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  // Create user record
  const userData = {
    email: employeeData.email,
    password_hash: passwordHash,
    first_name: employeeData.first_name,
    last_name: employeeData.last_name,
    phone: employeeData.phone || null,
    employee_id: employeeData.employee_id,
    department_id: employeeData.department_id || null,
    role_id: employeeData.role_id,
    designation: employeeData.designation || null,
    date_of_birth: employeeData.date_of_birth || null,
    date_of_joining: employeeData.date_of_joining || null,
    organization_id: adminUser.organization_id,
    is_first_login: true,
    is_active: true,
    created_by: adminUser.id,
  };

  const createdUser = await UserModel.create(userData);

  // Initialize leave balances for the current year
  try {
    const currentYear = new Date().getFullYear();
    const leaveTypes = await db('leave_types')
      .where('organization_id', adminUser.organization_id)
      .andWhere('is_active', true);

    if (leaveTypes.length > 0) {
      const leaveBalances = leaveTypes.map((lt) => ({
        user_id: createdUser.id,
        leave_type_id: lt.id,
        year: currentYear,
        total_days: lt.default_days_per_year,
        used_days: 0,
      }));

      await db('leave_balances').insert(leaveBalances);
    }
  } catch (err) {
    logger.error(`Failed to initialize leave balances for user ${createdUser.id}: ${err.message}`);
  }

  // Send welcome email with temporary password (non-blocking)
  try {
    await emailService.sendWelcomeEmail(
      createdUser.email,
      createdUser.first_name,
      tempPassword
    );
  } catch (err) {
    logger.error(`Failed to send welcome email to ${createdUser.email}: ${err.message}`);
  }

  // Remove sensitive fields before returning
  const { password_hash, ...employee } = createdUser;
  return employee;
};

/**
 * Get a single employee by ID with department and role info
 * @param {string} id - Employee UUID
 * @param {string} orgId - Organization UUID (for tenant isolation)
 * @returns {Promise<object>} Employee data
 */
const getEmployeeById = async (id, orgId) => {
  const employee = await db('users')
    .select(
      'users.*',
      'roles.name as role',
      'departments.name as department_name'
    )
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.id', id)
    .andWhere('users.organization_id', orgId)
    .first();

  if (!employee) {
    throw AppError.notFound('Employee not found');
  }

  const { password_hash, ...result } = employee;
  return result;
};

/**
 * List employees with pagination, search, and filters
 * @param {string} orgId - Organization UUID
 * @param {object} filters - { page, limit, search, department_id, is_active, sort_by, sort_order }
 * @returns {Promise<{ data: object[], pagination: object }>}
 */
const listEmployees = async (orgId, filters = {}) => {
  const { page, limit, offset } = parsePagination(filters);
  const { search, department_id, is_active, sort_by, sort_order } = filters;

  const query = db('users')
    .select(
      'users.id',
      'users.email',
      'users.first_name',
      'users.last_name',
      'users.employee_id',
      'users.phone',
      'users.designation',
      'users.is_active',
      'users.date_of_joining',
      'users.created_at',
      'roles.name as role',
      'departments.name as department_name'
    )
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.organization_id', orgId);

  // Search filter (ILIKE on multiple fields)
  if (search) {
    query.andWhere((qb) => {
      qb.whereILike('users.first_name', `%${search}%`)
        .orWhereILike('users.last_name', `%${search}%`)
        .orWhereILike('users.email', `%${search}%`)
        .orWhereILike('users.employee_id', `%${search}%`);
    });
  }

  // Department filter
  if (department_id) {
    query.andWhere('users.department_id', department_id);
  }

  // Active status filter
  if (is_active !== undefined) {
    query.andWhere('users.is_active', is_active === 'true');
  }

  // Get total count
  const countQuery = query.clone().clearSelect().clearOrder().count('users.id as count').first();
  const { count: total } = await countQuery;

  // Sorting — validate sort_by to prevent SQL injection
  const ALLOWED_SORT_COLUMNS = ['first_name', 'last_name', 'email', 'employee_id', 'created_at', 'date_of_joining'];
  const safeSortBy = (sort_by && ALLOWED_SORT_COLUMNS.includes(sort_by)) ? sort_by : 'created_at';
  const sortColumn = `users.${safeSortBy}`;
  const sortDir = sort_order || 'desc';

  // Get paginated data
  const data = await query
    .orderBy(sortColumn, sortDir)
    .limit(limit)
    .offset(offset);

  const pagination = buildPaginationMeta(parseInt(total, 10), page, limit);

  return { data, pagination };
};

/**
 * Update an employee's fields
 * @param {object} adminUser - The authenticated admin user
 * @param {string} employeeId - Employee UUID
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} Updated employee
 */
const updateEmployee = async (adminUser, employeeId, updateData) => {
  // Verify employee exists in same org
  const existing = await db('users')
    .where('id', employeeId)
    .andWhere('organization_id', adminUser.organization_id)
    .first();

  if (!existing) {
    throw AppError.notFound('Employee not found');
  }

  // Cannot change organization_id
  delete updateData.organization_id;

  // Check email uniqueness if email is being updated
  if (updateData.email && updateData.email !== existing.email) {
    const emailExists = await UserModel.findByEmail(updateData.email);
    if (emailExists) {
      throw AppError.conflict('A user with this email already exists');
    }
  }

  // Check employee_id uniqueness if being updated
  if (updateData.employee_id && updateData.employee_id !== existing.employee_id) {
    const empIdExists = await db('users')
      .where('employee_id', updateData.employee_id)
      .andWhere('organization_id', adminUser.organization_id)
      .whereNot('id', employeeId)
      .first();
    if (empIdExists) {
      throw AppError.conflict('An employee with this Employee ID already exists in this organization');
    }
  }

  // Capture old values for audit log (only changed fields)
  const oldValues = {};
  const newValues = {};
  for (const key of Object.keys(updateData)) {
    if (existing[key] !== undefined && String(existing[key]) !== String(updateData[key])) {
      oldValues[key] = existing[key];
      newValues[key] = updateData[key];
    }
  }

  const updatedUser = await UserModel.updateById(employeeId, updateData);

  // Log changes in audit_logs
  if (Object.keys(newValues).length > 0) {
    try {
      await AuditLogModel.create({
        user_id: adminUser.id,
        organization_id: adminUser.organization_id,
        action: 'update_employee',
        entity_type: 'user',
        entity_id: employeeId,
        old_values: oldValues,
        new_values: newValues,
      });
    } catch (err) {
      logger.error(`Failed to create audit log for employee update: ${err.message}`);
    }
  }

  const { password_hash, ...result } = updatedUser;
  return result;
};

/**
 * Soft-deactivate an employee
 * @param {object} adminUser - The authenticated admin user
 * @param {string} employeeId - Employee UUID
 * @returns {Promise<object>} Deactivated employee
 */
const deactivateEmployee = async (adminUser, employeeId) => {
  const existing = await db('users')
    .where('id', employeeId)
    .andWhere('organization_id', adminUser.organization_id)
    .first();

  if (!existing) {
    throw AppError.notFound('Employee not found');
  }

  if (!existing.is_active) {
    throw AppError.badRequest('Employee is already deactivated');
  }

  // Prevent deactivating yourself
  if (employeeId === adminUser.id) {
    throw AppError.badRequest('You cannot deactivate your own account');
  }

  const updatedUser = await UserModel.updateById(employeeId, { is_active: false });

  // Revoke all sessions for this user
  try {
    const SessionModel = require('../models/session.model');
    await SessionModel.revokeAllByUserId(employeeId);
  } catch (err) {
    logger.error(`Failed to revoke sessions for deactivated user ${employeeId}: ${err.message}`);
  }

  // Audit log
  try {
    await AuditLogModel.create({
      user_id: adminUser.id,
      organization_id: adminUser.organization_id,
      action: 'deactivate_employee',
      entity_type: 'user',
      entity_id: employeeId,
      old_values: { is_active: true },
      new_values: { is_active: false },
    });
  } catch (err) {
    logger.error(`Failed to create audit log for deactivation: ${err.message}`);
  }

  const { password_hash, ...result } = updatedUser;
  return result;
};

/**
 * Reactivate a deactivated employee
 * @param {object} adminUser - The authenticated admin user
 * @param {string} employeeId - Employee UUID
 * @returns {Promise<object>} Reactivated employee
 */
const reactivateEmployee = async (adminUser, employeeId) => {
  const existing = await db('users')
    .where('id', employeeId)
    .andWhere('organization_id', adminUser.organization_id)
    .first();

  if (!existing) {
    throw AppError.notFound('Employee not found');
  }

  if (existing.is_active) {
    throw AppError.badRequest('Employee is already active');
  }

  const updatedUser = await UserModel.updateById(employeeId, { is_active: true });

  // Audit log
  try {
    await AuditLogModel.create({
      user_id: adminUser.id,
      organization_id: adminUser.organization_id,
      action: 'reactivate_employee',
      entity_type: 'user',
      entity_id: employeeId,
      old_values: { is_active: false },
      new_values: { is_active: true },
    });
  } catch (err) {
    logger.error(`Failed to create audit log for reactivation: ${err.message}`);
  }

  const { password_hash, ...result } = updatedUser;
  return result;
};

/**
 * Get all departments for an organization
 * @param {string} orgId - Organization UUID
 * @returns {Promise<object[]>}
 */
const getDepartments = async (orgId) => {
  return DepartmentModel.findAllByOrgId(orgId);
};

/**
 * Get all roles
 * @returns {Promise<object[]>}
 */
const getRoles = async () => {
  return db('roles').select('id', 'name', 'description').orderBy('name', 'asc');
};

module.exports = {
  createEmployee,
  getEmployeeById,
  listEmployees,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  getDepartments,
  getRoles,
};
