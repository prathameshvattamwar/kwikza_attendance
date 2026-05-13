const knex = require('knex');
const env = require('./env');
const logger = require('../utils/logger');

const db = knex({
  client: 'pg',
  connection: {
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  acquireConnectionTimeout: 60000,
});

/**
 * Test database connectivity
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const result = await db.raw('SELECT NOW() AS current_time');
    logger.info(
      `Database connected successfully at ${result.rows[0].current_time}`
    );
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    return false;
  }
}

module.exports = { db, testConnection };
