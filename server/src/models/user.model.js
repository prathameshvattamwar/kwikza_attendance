const db = require('../config/database');

const TABLE = 'users';

/**
 * Find a user by email, with role join
 * @param {string} email
 * @returns {Promise<object|undefined>}
 */
const findByEmail = async (email) => {
  return db(TABLE)
    .select(
      'users.*',
      'roles.name as role'
    )
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .where('users.email', email.toLowerCase())
    .first();
};

/**
 * Find a user by ID, with role and department join
 * @param {string} id - UUID
 * @returns {Promise<object|undefined>}
 */
const findById = async (id) => {
  return db(TABLE)
    .select(
      'users.*',
      'roles.name as role',
      'departments.name as department_name'
    )
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.id', id)
    .first();
};

/**
 * Create a new user
 * @param {object} userData
 * @returns {Promise<object>} The created user row
 */
const create = async (userData) => {
  const [user] = await db(TABLE).insert(userData).returning('*');
  return user;
};

/**
 * Update a user by ID
 * @param {string} id - UUID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} The updated user row
 */
const updateById = async (id, data) => {
  const [user] = await db(TABLE)
    .where('id', id)
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return user;
};

/**
 * Find all users for an organization with pagination and filters
 * @param {string} orgId - Organization UUID
 * @param {object} options - { page, limit, search, department_id, is_active }
 * @returns {Promise<{ data: object[], total: number }>}
 */
const findAll = async (orgId, { page = 1, limit = 20, search, department_id, is_active } = {}) => {
  const offset = (page - 1) * limit;

  const query = db(TABLE)
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

  // Apply filters
  if (search) {
    query.andWhere((qb) => {
      qb.whereILike('users.first_name', `%${search}%`)
        .orWhereILike('users.last_name', `%${search}%`)
        .orWhereILike('users.email', `%${search}%`)
        .orWhereILike('users.employee_id', `%${search}%`);
    });
  }

  if (department_id) {
    query.andWhere('users.department_id', department_id);
  }

  if (typeof is_active === 'boolean') {
    query.andWhere('users.is_active', is_active);
  }

  // Get total count
  const countQuery = query.clone().clearSelect().clearOrder().count('users.id as count').first();
  const { count: total } = await countQuery;

  // Get paginated data
  const data = await query
    .orderBy('users.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return { data, total: parseInt(total, 10) };
};

/**
 * Update user password
 * @param {string} id - UUID
 * @param {string} hashedPassword
 * @returns {Promise<object>}
 */
const updatePassword = async (id, hashedPassword) => {
  const [user] = await db(TABLE)
    .where('id', id)
    .update({
      password_hash: hashedPassword,
      updated_at: db.fn.now(),
    })
    .returning('id');
  return user;
};

/**
 * Update last login timestamp
 * @param {string} id - UUID
 * @returns {Promise<void>}
 */
const updateLastLogin = async (id) => {
  await db(TABLE)
    .where('id', id)
    .update({ last_login_at: db.fn.now() });
};

module.exports = {
  findByEmail,
  findById,
  create,
  updateById,
  findAll,
  updatePassword,
  updateLastLogin,
};
