const db = require('../config/database');

const TABLE = 'sessions';

/**
 * Create a new session
 * @param {object} sessionData - { user_id, refresh_token_hash, ip_address, user_agent, expires_at }
 * @returns {Promise<object>} The created session
 */
const create = async (sessionData) => {
  const [session] = await db(TABLE).insert(sessionData).returning('*');
  return session;
};

/**
 * Find a valid (non-revoked, non-expired) session by user ID and token hash
 * @param {string} userId - UUID
 * @param {string} tokenHash - SHA-256 hash of the refresh token
 * @returns {Promise<object|undefined>}
 */
const findByUserIdAndToken = async (userId, tokenHash) => {
  return db(TABLE)
    .where('user_id', userId)
    .andWhere('refresh_token_hash', tokenHash)
    .andWhere('is_revoked', false)
    .andWhere('expires_at', '>', db.fn.now())
    .first();
};

/**
 * Revoke a single session by ID
 * @param {string} id - Session UUID
 * @returns {Promise<void>}
 */
const revokeById = async (id) => {
  await db(TABLE)
    .where('id', id)
    .update({
      is_revoked: true,
      updated_at: db.fn.now(),
    });
};

/**
 * Revoke all sessions for a user
 * @param {string} userId - UUID
 * @returns {Promise<void>}
 */
const revokeAllByUserId = async (userId) => {
  await db(TABLE)
    .where('user_id', userId)
    .andWhere('is_revoked', false)
    .update({
      is_revoked: true,
      updated_at: db.fn.now(),
    });
};

/**
 * Delete expired sessions (cleanup job)
 * @returns {Promise<number>} Number of deleted rows
 */
const deleteExpired = async () => {
  return db(TABLE)
    .where('expires_at', '<', db.fn.now())
    .orWhere('is_revoked', true)
    .del();
};

module.exports = {
  create,
  findByUserIdAndToken,
  revokeById,
  revokeAllByUserId,
  deleteExpired,
};
