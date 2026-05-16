const LeaveModel = require('../models/leave.model');
const UserModel = require('../models/user.model');
const emailService = require('./email.service');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { LEAVE_STATUS } = require('../config/constants');
const db = require('../config/database');

/**
 * Get all active leave types for an organization
 */
const getLeaveTypes = async (orgId) => {
  return LeaveModel.findLeaveTypesByOrgId(orgId, { activeOnly: true });
};

/**
 * Get leave balances for a user in a given year.
 * Auto-creates missing balances from leave_types.default_days_per_year.
 */
const getLeaveBalance = async (userId, orgId, year) => {
  // Get all active leave types for the org
  const leaveTypes = await LeaveModel.findLeaveTypesByOrgId(orgId, { activeOnly: true });

  // Get existing balances
  const existingBalances = await LeaveModel.findBalancesByUserId(userId, year);
  const existingTypeIds = new Set(existingBalances.map((b) => b.leave_type_id));

  // Auto-create missing balances
  const missingTypes = leaveTypes.filter((lt) => !existingTypeIds.has(lt.id));

  if (missingTypes.length > 0) {
    for (const lt of missingTypes) {
      await LeaveModel.createBalance({
        user_id: userId,
        leave_type_id: lt.id,
        year,
        total_days: lt.default_days_per_year || 0,
        used_days: 0,
      });
    }

    // Re-fetch with joined data
    return LeaveModel.findBalancesByUserId(userId, year);
  }

  return existingBalances;
};

/**
 * Get paginated leave requests for the current user
 */
const getMyLeaves = async (userId, query) => {
  const { page, limit, offset } = parsePagination(query);
  const filters = {
    status: query.status,
    year: query.year ? parseInt(query.year, 10) : undefined,
  };

  const [requests, total] = await Promise.all([
    LeaveModel.findRequestsByUserId(userId, { offset, limit, ...filters }),
    LeaveModel.countRequestsByUserId(userId, filters),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);
  return { data: requests, pagination };
};

/**
 * Apply for leave
 */
const applyLeave = async (userId, orgId, { leave_type_id, start_date, end_date, reason }) => {
  // 1. Validate leave type exists and belongs to org
  const leaveType = await LeaveModel.findLeaveTypeById(leave_type_id);
  if (!leaveType || leaveType.organization_id !== orgId) {
    throw AppError.notFound('Leave type not found');
  }

  // 2. Validate dates
  const start = new Date(start_date);
  const end = new Date(end_date);
  if (end < start) {
    throw AppError.badRequest('End date cannot be before start date');
  }

  // 3. Calculate total days (simple calendar days)
  const diffTime = end.getTime() - start.getTime();
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // 4. Check for overlapping leaves
  const overlap = await LeaveModel.checkOverlappingLeave(userId, start_date, end_date);
  if (overlap) {
    throw AppError.conflict('You already have a leave request overlapping with these dates');
  }

  // 5. Check leave balance
  const year = start.getFullYear();
  const balance = await LeaveModel.findBalance(userId, leave_type_id, year);

  if (balance) {
    const remaining = parseFloat(balance.total_days) - parseFloat(balance.used_days);
    if (totalDays > remaining) {
      throw AppError.badRequest(
        `Insufficient leave balance. Available: ${remaining} days, Requested: ${totalDays} days`
      );
    }
  } else {
    // Auto-create balance if missing
    const defaultDays = leaveType.default_days_per_year || 0;
    if (totalDays > defaultDays) {
      throw AppError.badRequest(
        `Insufficient leave balance. Available: ${defaultDays} days, Requested: ${totalDays} days`
      );
    }
    await LeaveModel.createBalance({
      user_id: userId,
      leave_type_id,
      year,
      total_days: defaultDays,
      used_days: 0,
    });
  }

  // 6. Create leave request
  const request = await LeaveModel.createRequest({
    user_id: userId,
    leave_type_id,
    start_date,
    end_date,
    total_days: totalDays,
    reason,
    status: LEAVE_STATUS.PENDING,
    applied_at: db.fn.now(),
  });

  // 7. Send confirmation email (non-blocking)
  const user = await UserModel.findById(userId);
  if (user) {
    emailService.sendLeaveAppliedEmail(user.email, user.first_name, {
      leave_type: leaveType.name,
      start_date,
      end_date,
      total_days: totalDays,
    }).catch((err) => logger.error(`Leave applied email failed: ${err.message}`));
  }

  return request;
};

/**
 * Cancel own pending leave request
 */
const cancelLeave = async (userId, leaveId) => {
  const request = await LeaveModel.findRequestById(leaveId);

  if (!request) {
    throw AppError.notFound('Leave request not found');
  }

  if (request.user_id !== userId) {
    throw AppError.forbidden('You can only cancel your own leave requests');
  }

  if (request.status !== LEAVE_STATUS.PENDING) {
    throw AppError.badRequest('Only pending leave requests can be cancelled');
  }

  const updated = await LeaveModel.updateRequest(leaveId, {
    status: LEAVE_STATUS.CANCELLED,
  });

  return updated;
};

/**
 * Get all pending leave requests in an organization (admin)
 */
const getPendingRequests = async (orgId, query) => {
  const { page, limit, offset } = parsePagination(query);

  const [requests, total] = await Promise.all([
    LeaveModel.findRequestsByOrgId(orgId, { offset, limit, status: LEAVE_STATUS.PENDING }),
    LeaveModel.countRequestsByOrgId(orgId, { status: LEAVE_STATUS.PENDING }),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);
  return { data: requests, pagination };
};

/**
 * Approve a leave request (admin)
 */
const approveLeave = async (adminId, leaveId) => {
  const request = await LeaveModel.findRequestById(leaveId);

  if (!request) {
    throw AppError.notFound('Leave request not found');
  }

  if (request.status !== LEAVE_STATUS.PENDING) {
    throw AppError.badRequest('Only pending leave requests can be approved');
  }

  const updated = await LeaveModel.updateRequest(leaveId, {
    status: LEAVE_STATUS.APPROVED,
    reviewed_by: adminId,
    reviewed_at: db.fn.now(),
  });

  // Send approval email (non-blocking)
  const user = await UserModel.findById(request.user_id);
  if (user) {
    emailService.sendLeaveStatusEmail(user.email, user.first_name, 'approved', {
      leave_type: request.leave_type_name || '',
      start_date: request.start_date,
      end_date: request.end_date,
      total_days: request.total_days,
    }).catch((err) => logger.error(`Leave approved email failed: ${err.message}`));
  }

  return updated;
};

/**
 * Reject a leave request (admin)
 */
const rejectLeave = async (adminId, leaveId, reason) => {
  const request = await LeaveModel.findRequestById(leaveId);

  if (!request) {
    throw AppError.notFound('Leave request not found');
  }

  if (request.status !== LEAVE_STATUS.PENDING) {
    throw AppError.badRequest('Only pending leave requests can be rejected');
  }

  const updated = await LeaveModel.updateRequest(leaveId, {
    status: LEAVE_STATUS.REJECTED,
    reviewed_by: adminId,
    reviewed_at: db.fn.now(),
    review_remarks: reason,
  });

  // Send rejection email (non-blocking)
  const user = await UserModel.findById(request.user_id);
  if (user) {
    emailService.sendLeaveStatusEmail(user.email, user.first_name, 'rejected', {
      leave_type: request.leave_type_name || '',
      start_date: request.start_date,
      end_date: request.end_date,
      total_days: request.total_days,
    }, reason).catch((err) => logger.error(`Leave rejected email failed: ${err.message}`));
  }

  return updated;
};

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
