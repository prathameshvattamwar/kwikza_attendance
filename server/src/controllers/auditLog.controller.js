const asyncHandler = require('../middleware/asyncHandler');
const AuditLogModel = require('../models/auditLog.model');
const { paginated } = require('../utils/response');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');

/**
 * GET /audit-logs
 * Get audit logs for the authenticated user's organization
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const { action, entity_type } = req.query;
  const { page, limit } = parsePagination(req.query);

  const result = await AuditLogModel.findByOrganization(orgId, {
    page,
    limit,
    action,
    entity_type,
  });

  const pagination = buildPaginationMeta(result.total, page, limit);

  return paginated(res, result.data, pagination, 'Audit logs fetched');
});

module.exports = {
  getAuditLogs,
};
