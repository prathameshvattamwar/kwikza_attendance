/**
 * Standardized API response utilities
 */

/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {*} data - Response data
 * @param {string} [message='Success'] - Response message
 * @param {number} [statusCode=200] - HTTP status code
 */
function success(res, message = 'Success', data = null, statusCode = 200) {
  const response = {
    success: true,
    message,
  };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
}

/**
 * Send a 201 created response
 * @param {object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} [message='Resource created successfully'] - Response message
 */
function created(res, data = null, message = 'Resource created successfully') {
  return success(res, message, data, 201);
}

/**
 * Send a paginated response
 * @param {object} res - Express response object
 * @param {Array} data - Array of items
 * @param {object} pagination - Pagination meta from buildPaginationMeta
 * @param {string} [message='Success'] - Response message
 */
function paginated(res, data, pagination, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
}

module.exports = { success, created, paginated };
