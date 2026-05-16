const express = require('express');
const router = express.Router();

const leaveController = require('../controllers/leave.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/constants');
const { applyLeaveSchema, rejectLeaveSchema } = require('../validators/leave.validator');

// All routes require authentication
router.use(authenticate);

// Employee routes
router.get('/types', leaveController.getLeaveTypes);
router.get('/balance', leaveController.getLeaveBalance);
router.get('/my', leaveController.getMyLeaves);
router.post('/apply', validate(applyLeaveSchema), leaveController.applyLeave);
router.patch('/:id/cancel', leaveController.cancelLeave);

// Admin routes
router.get(
  '/pending',
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  leaveController.getPendingRequests
);

router.patch(
  '/:id/approve',
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  leaveController.approveLeave
);

router.patch(
  '/:id/reject',
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  validate(rejectLeaveSchema),
  leaveController.rejectLeave
);

module.exports = router;
