const express = require('express');
const router = express.Router();

const reportsController = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

// All report routes require authentication and admin-level roles
router.use(authenticate);
router.use(authorize('super_admin', 'org_admin', 'hr_manager'));

// Report data (paginated)
router.get('/attendance', reportsController.getAttendanceReport);
router.get('/leaves', reportsController.getLeaveReport);
router.get('/employees', reportsController.getEmployeeReport);

// CSV exports
router.get('/attendance/export', reportsController.exportAttendance);
router.get('/leaves/export', reportsController.exportLeaves);
router.get('/employees/export', reportsController.exportEmployees);

module.exports = router;
