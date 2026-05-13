const { PAGINATION } = require('../config/constants');

/**
 * Parse pagination parameters from query string
 * @param {object} query - Express req.query
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) {
    page = PAGINATION.DEFAULT_PAGE;
  }

  if (isNaN(limit) || limit < 1) {
    limit = PAGINATION.PAGE_SIZE;
  }

  if (limit > PAGINATION.MAX_PAGE_SIZE) {
    limit = PAGINATION.MAX_PAGE_SIZE;
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build pagination metadata for response
 * @param {number} total - Total number of records
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {{ total: number, page: number, limit: number, totalPages: number, hasNext: boolean, hasPrev: boolean }}
 */
function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

module.exports = { parsePagination, buildPaginationMeta };
