const db = require('../config/database');

const TABLE = 'holidays';

const findByOrgId = async (orgId, { year, activeOnly = true } = {}) => {
  const query = db(TABLE).where('organization_id', orgId);

  if (activeOnly) {
    query.andWhere('is_active', true);
  }
  if (year) {
    query.andWhereRaw('EXTRACT(YEAR FROM date) = ?', [year]);
  }

  return query.orderBy('date', 'asc');
};

const findById = async (id) => {
  return db(TABLE).where('id', id).first();
};

const create = async (data) => {
  const [record] = await db(TABLE).insert(data).returning('*');
  return record;
};

const updateById = async (id, data) => {
  const [record] = await db(TABLE)
    .where('id', id)
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return record;
};

const deleteById = async (id) => {
  return db(TABLE).where('id', id).del();
};

module.exports = {
  findByOrgId,
  findById,
  create,
  updateById,
  deleteById,
};
