const express = require('express');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

// Apply API rate limiter to all v1 routes
router.use(apiLimiter);

// Mount route modules
router.use('/auth', require('./auth.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/employees', require('./employee.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/leaves', require('./leave.routes'));
router.use('/holidays', require('./holiday.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/audit-logs', require('./auditLog.routes'));

module.exports = router;
