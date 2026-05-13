const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/constants');
const {
  checkInSchema,
  checkOutSchema,
  getHistorySchema,
  manualEntrySchema,
} = require('../validators/attendance.validator');

// All routes require authentication
router.use(authenticate);

// Employee routes
router.post('/check-in', validate(checkInSchema), attendanceController.checkIn);
router.post('/check-out', validate(checkOutSchema), attendanceController.checkOut);
router.get('/today', attendanceController.getTodayStatus);
router.get('/history', validate(getHistorySchema, 'query'), attendanceController.getHistory);
router.get('/summary/:year/:month', attendanceController.getMonthlySummary);

// Admin routes
router.post(
  '/manual',
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  validate(manualEntrySchema),
  attendanceController.manualEntry
);

router.get(
  '/org-overview',
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  attendanceController.getOrgAttendance
);

module.exports = router;
