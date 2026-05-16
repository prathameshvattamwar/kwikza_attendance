const AuditLogModel = require('../models/auditLog.model');
const logger = require('./logger');

/**
 * Log an audit event (non-blocking)
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.orgId
 * @param {string} params.action - e.g., 'login', 'leave.approve', 'employee.create'
 * @param {string} params.entityType - e.g., 'user', 'leave_request', 'holiday'
 * @param {string} [params.entityId]
 * @param {object} [params.oldValues]
 * @param {object} [params.newValues]
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 */
const logAudit = (params) => {
  AuditLogModel.create({
    user_id: params.userId,
    organization_id: params.orgId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    old_values: params.oldValues || null,
    new_values: params.newValues || null,
    ip_address: params.ipAddress || null,
    user_agent: params.userAgent || null,
  }).catch((err) => {
    logger.error(`Audit log failed: ${err.message}`);
  });
};

module.exports = { logAudit };
