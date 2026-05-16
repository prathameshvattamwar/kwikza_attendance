const asyncHandler = require('../middleware/asyncHandler');
const reportsService = require('../services/reports.service');
const { success, paginated } = require('../utils/response');

/**
 * GET /reports/attendance
 * Get attendance report with pagination
 */
const getAttendanceReport = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const { start_date, end_date, page, limit } = req.query;

  const result = await reportsService.getAttendanceReport(orgId, {
    start_date,
    end_date,
    page,
    limit,
  });

  return paginated(res, result.data, result.pagination, 'Attendance report fetched');
});

/**
 * GET /reports/leaves
 * Get leave report with pagination
 */
const getLeaveReport = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const { start_date, end_date, page, limit } = req.query;

  const result = await reportsService.getLeaveReport(orgId, {
    start_date,
    end_date,
    page,
    limit,
  });

  return paginated(res, result.data, result.pagination, 'Leave report fetched');
});

/**
 * GET /reports/employees
 * Get employee directory report with pagination
 */
const getEmployeeReport = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const { page, limit } = req.query;

  const result = await reportsService.getEmployeeReport(orgId, { page, limit });

  return paginated(res, result.data, result.pagination, 'Employee report fetched');
});

/**
 * GET /reports/attendance/export
 * Export attendance data as CSV
 */
const exportAttendance = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const { start_date, end_date } = req.query;

  const data = await reportsService.getAttendanceExport(orgId, { start_date, end_date });

  const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Date', 'Check In', 'Check Out', 'Status', 'Work Hours'];
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      [
        row.employee_id,
        row.first_name,
        row.last_name,
        row.email,
        row.department || '',
        row.date,
        row.check_in || '',
        row.check_out || '',
        row.status || '',
        row.work_hours || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${start_date || 'all'}_to_${end_date || 'all'}.csv`);
  return res.send(csvRows.join('\n'));
});

/**
 * GET /reports/leaves/export
 * Export leave data as CSV
 */
const exportLeaves = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const { start_date, end_date } = req.query;

  const data = await reportsService.getLeaveExport(orgId, { start_date, end_date });

  const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Applied On'];
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      [
        row.employee_id,
        row.first_name,
        row.last_name,
        row.email,
        row.department || '',
        row.leave_type || '',
        row.start_date,
        row.end_date,
        row.total_days || '',
        row.status || '',
        row.reason || '',
        row.created_at || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=leave_report_${start_date || 'all'}_to_${end_date || 'all'}.csv`);
  return res.send(csvRows.join('\n'));
});

/**
 * GET /reports/employees/export
 * Export employee directory as CSV
 */
const exportEmployees = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;

  const data = await reportsService.getEmployeeExport(orgId);

  const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Designation', 'Department', 'Role', 'Date of Joining', 'Active'];
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      [
        row.employee_id,
        row.first_name,
        row.last_name,
        row.email,
        row.phone || '',
        row.designation || '',
        row.department || '',
        row.role || '',
        row.date_of_joining || '',
        row.is_active ? 'Yes' : 'No',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=employee_directory.csv');
  return res.send(csvRows.join('\n'));
});

module.exports = {
  getAttendanceReport,
  getLeaveReport,
  getEmployeeReport,
  exportAttendance,
  exportLeaves,
  exportEmployees,
};
