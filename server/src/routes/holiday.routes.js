const express = require('express');
const router = express.Router();

const holidayController = require('../controllers/holiday.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/constants');
const { createHolidaySchema, updateHolidaySchema } = require('../validators/holiday.validator');

// All routes require authentication
router.use(authenticate);

// All authenticated users can view holidays
router.get('/', holidayController.getHolidays);

// Admin routes
router.post(
  '/',
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  validate(createHolidaySchema),
  holidayController.createHoliday
);

router.patch(
  '/:id',
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  validate(updateHolidaySchema),
  holidayController.updateHoliday
);

router.delete(
  '/:id',
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  holidayController.deleteHoliday
);

module.exports = router;
