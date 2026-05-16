const asyncHandler = require('../middleware/asyncHandler');
const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/response');

/**
 * GET /dashboard/admin
 * Admin dashboard with org-wide stats
 */
const adminDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getAdminDashboard(
    req.user.organization_id
  );
  return success(res, 'Admin dashboard fetched successfully', data);
});

/**
 * GET /dashboard/employee
 * Employee personal dashboard
 */
const employeeDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getEmployeeDashboard(req.user);
  return success(res, 'Employee dashboard fetched successfully', data);
});

module.exports = {
  adminDashboard,
  employeeDashboard,
};
