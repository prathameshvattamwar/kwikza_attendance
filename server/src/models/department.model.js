const db = require('../config/database');

const TABLE = 'departments';

/**
 * Find all active departments for an organization
 * @param {string} orgId - Organization UUID
 * @returns {Promise<object[]>}
 */
const findAllByOrgId = async (orgId) => {
  return db(TABLE)
    .select('*')
    .where('organization_id', orgId)
    .andWhere('is_active', true)
    .orderBy('name', 'asc');
};

/**
 * Find a department by ID
 * @param {string} id - Department UUID
 * @returns {Promise<object|undefined>}
 */
const findById = async (id) => {
  return db(TABLE).where('id', id).first();
};

/**
 * Create a new department
 * @param {object} data - Department data
 * @returns {Promise<object>} The created department
 */
const create = async (data) => {
  const [department] = await db(TABLE).insert(data).returning('*');
  return department;
};

/**
 * Update a department by ID
 * @param {string} id - Department UUID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} The updated department
 */
const updateById = async (id, data) => {
  const [department] = await db(TABLE)
    .where('id', id)
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return department;
};

module.exports = {
  findAllByOrgId,
  findById,
  create,
  updateById,
};
