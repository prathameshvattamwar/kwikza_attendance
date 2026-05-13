const db = require('../config/database');

const TABLE = 'audit_logs';

/**
 * Create an audit log entry
 * @param {object} logData - { user_id, organization_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent }
 * @returns {Promise<object>} The created audit log
 */
const create = async (logData) => {
  const [log] = await db(TABLE)
    .insert({
      user_id: logData.user_id,
      organization_id: logData.organization_id,
      action: logData.action,
      entity_type: logData.entity_type,
      entity_id: logData.entity_id,
      old_values: logData.old_values ? JSON.stringify(logData.old_values) : null,
      new_values: logData.new_values ? JSON.stringify(logData.new_values) : null,
      ip_address: logData.ip_address || null,
      user_agent: logData.user_agent || null,
    })
    .returning('*');
  return log;
};

/**
 * Find audit logs for a specific entity with pagination
 * @param {string} entityType - e.g., 'user', 'department'
 * @param {string} entityId - UUID of the entity
 * @param {object} options - { page, limit }
 * @returns {Promise<{ data: object[], total: number }>}
 */
const findByEntity = async (entityType, entityId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const query = db(TABLE)
    .where('entity_type', entityType)
    .andWhere('entity_id', entityId);

  // Get total count
  const countQuery = query.clone().count('id as count').first();
  const { count: total } = await countQuery;

  // Get paginated data
  const data = await query
    .clone()
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return { data, total: parseInt(total, 10) };
};

module.exports = {
  create,
  findByEntity,
};
