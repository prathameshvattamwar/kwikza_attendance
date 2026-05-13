const express = require('express');
const router = express.Router();

const employeeController = require('../controllers/employee.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/constants');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
} = require('../validators/employee.validator');

// GET /employees — List employees (admin/HR)
router.get(
  '/',
  authenticate,
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  validate(listEmployeesSchema, 'query'),
  employeeController.listEmployees
);

// POST /employees — Create employee (admin/HR)
router.post(
  '/',
  authenticate,
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  validate(createEmployeeSchema),
  employeeController.createEmployee
);

// GET /employees/departments — List departments (authenticated)
router.get(
  '/departments',
  authenticate,
  employeeController.getDepartments
);

// GET /employees/roles — List roles (authenticated)
router.get(
  '/roles',
  authenticate,
  employeeController.getRoles
);

// GET /employees/:id — Get single employee (admin/HR)
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  employeeController.getEmployee
);

// PATCH /employees/:id — Update employee (admin/HR)
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  validate(updateEmployeeSchema),
  employeeController.updateEmployee
);

// PATCH /employees/:id/deactivate — Deactivate employee (org_admin only)
router.patch(
  '/:id/deactivate',
  authenticate,
  authorize(ROLES.ORG_ADMIN),
  employeeController.deactivateEmployee
);

// PATCH /employees/:id/reactivate — Reactivate employee (org_admin only)
router.patch(
  '/:id/reactivate',
  authenticate,
  authorize(ROLES.ORG_ADMIN),
  employeeController.reactivateEmployee
);

module.exports = router;
