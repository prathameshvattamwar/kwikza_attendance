const asyncHandler = require('../middleware/asyncHandler');
const leaveService = require('../services/leave.service');
const { success, created, paginated } = require('../utils/response');
const { logAudit } = require('../utils/auditHelper');

/**
 * GET /leaves/types
 * Get all leave types for the user's organization
 */
const getLeaveTypes = asyncHandler(async (req, res) => {
  const types = await leaveService.getLeaveTypes(req.user.organization_id);
  return success(res, 'Leave types fetched', types);
});

/**
 * GET /leaves/balance?year=2026
 * Get leave balances for the authenticated user
 */
const getLeaveBalance = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const balances = await leaveService.getLeaveBalance(req.user.id, req.user.organization_id, year);
  return success(res, 'Leave balances fetched', balances);
});

/**
 * GET /leaves/my?page=1&limit=20&status=pending
 * Get paginated leave requests for the authenticated user
 */
const getMyLeaves = asyncHandler(async (req, res) => {
  const { data, pagination } = await leaveService.getMyLeaves(req.user.id, req.query);
  return paginated(res, data, pagination, 'Leave requests fetched');
});

/**
 * POST /leaves/apply
 * Apply for leave
 */
const applyLeave = asyncHandler(async (req, res) => {
  const request = await leaveService.applyLeave(req.user.id, req.user.organization_id, req.body);
  return created(res, request, 'Leave request submitted successfully');
});

/**
 * PATCH /leaves/:id/cancel
 * Cancel own pending leave request
 */
const cancelLeave = asyncHandler(async (req, res) => {
  const result = await leaveService.cancelLeave(req.user.id, req.params.id);
  return success(res, 'Leave request cancelled', result);
});

/**
 * GET /leaves/pending
 * Admin: get all pending leave requests in the organization
 */
const getPendingRequests = asyncHandler(async (req, res) => {
  const { data, pagination } = await leaveService.getPendingRequests(
    req.user.organization_id,
    req.query
  );
  return paginated(res, data, pagination, 'Pending leave requests fetched');
});

/**
 * PATCH /leaves/:id/approve
 * Admin: approve a leave request
 */
const approveLeave = asyncHandler(async (req, res) => {
  const result = await leaveService.approveLeave(req.user.id, req.params.id);

  logAudit({
    userId: req.user.id,
    orgId: req.user.organization_id,
    action: 'leave.approve',
    entityType: 'leave_request',
    entityId: req.params.id,
  });

  return success(res, 'Leave request approved', result);
});

/**
 * PATCH /leaves/:id/reject
 * Admin: reject a leave request
 */
const rejectLeave = asyncHandler(async (req, res) => {
  const result = await leaveService.rejectLeave(req.user.id, req.params.id, req.body.reason);

  logAudit({
    userId: req.user.id,
    orgId: req.user.organization_id,
    action: 'leave.reject',
    entityType: 'leave_request',
    entityId: req.params.id,
  });

  return success(res, 'Leave request rejected', result);
});

module.exports = {
  getLeaveTypes,
  getLeaveBalance,
  getMyLeaves,
  applyLeave,
  cancelLeave,
  getPendingRequests,
  approveLeave,
  rejectLeave,
};
