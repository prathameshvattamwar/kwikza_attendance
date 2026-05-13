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
  return success(res, data, 'Admin dashboard fetched successfully');
});

/**
 * GET /dashboard/employee
 * Employee personal dashboard
 */
const employeeDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getEmployeeDashboard(req.user);
  return success(res, data, 'Employee dashboard fetched successfully');
});

module.exports = {
  adminDashboard,
  employeeDashboard,
};
