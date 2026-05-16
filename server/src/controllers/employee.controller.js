const asyncHandler = require('../middleware/asyncHandler');
const employeeService = require('../services/employee.service');
const { success, created, paginated } = require('../utils/response');

/**
 * POST /employees
 * Create a new employee (admin only)
 */
const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.user, req.body);
  return created(res, employee, 'Employee created successfully');
});

/**
 * GET /employees/:id
 * Get a single employee by ID (admin only)
 */
const getEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(
    req.params.id,
    req.user.organization_id
  );
  return success(res, 'Employee fetched successfully', employee);
});

/**
 * GET /employees
 * List employees with pagination and filters (admin only)
 */
const listEmployees = asyncHandler(async (req, res) => {
  const { data, pagination } = await employeeService.listEmployees(
    req.user.organization_id,
    req.query
  );
  return paginated(res, data, pagination, 'Employees fetched successfully');
});

/**
 * PATCH /employees/:id
 * Update an employee (admin only)
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(
    req.user,
    req.params.id,
    req.body
  );
  return success(res, 'Employee updated successfully', employee);
});

/**
 * PATCH /employees/:id/deactivate
 * Soft-deactivate an employee (org_admin only)
 */
const deactivateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.deactivateEmployee(
    req.user,
    req.params.id
  );
  return success(res, 'Employee deactivated successfully', employee);
});

/**
 * PATCH /employees/:id/reactivate
 * Reactivate an employee (org_admin only)
 */
const reactivateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.reactivateEmployee(
    req.user,
    req.params.id
  );
  return success(res, 'Employee reactivated successfully', employee);
});

/**
 * GET /employees/departments
 * List all departments for the org (authenticated)
 */
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await employeeService.getDepartments(
    req.user.organization_id
  );
  return success(res, 'Departments fetched successfully', departments);
});

/**
 * GET /employees/roles
 * List all roles (authenticated)
 */
const getRoles = asyncHandler(async (req, res) => {
  const roles = await employeeService.getRoles();
  return success(res, 'Roles fetched successfully', roles);
});

module.exports = {
  createEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  getDepartments,
  getRoles,
};
