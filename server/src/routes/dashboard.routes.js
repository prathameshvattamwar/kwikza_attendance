const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { ROLES } = require('../config/constants');

// GET /dashboard/admin — Admin dashboard (org_admin, hr_manager)
router.get(
  '/admin',
  authenticate,
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  dashboardController.adminDashboard
);

// GET /dashboard/employee — Employee personal dashboard (any authenticated user)
router.get(
  '/employee',
  authenticate,
  dashboardController.employeeDashboard
);

module.exports = router;
