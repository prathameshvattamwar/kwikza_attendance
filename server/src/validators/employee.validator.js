const { z } = require('zod');

const createEmployeeSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  phone: z.string().trim().max(20).optional().nullable(),
  employee_id: z.string().trim().min(1, 'Employee ID is required').max(50),
  department_id: z.string().uuid('Invalid department ID').optional().nullable(),
  role_id: z.string().uuid('Invalid role ID'),
  designation: z.string().trim().max(100).optional().nullable(),
  date_of_birth: z.string().date('Date must be YYYY-MM-DD').optional().nullable(),
  date_of_joining: z.string().date('Date must be YYYY-MM-DD').optional().nullable(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

const listEmployeesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(200).optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z
    .enum(['first_name', 'last_name', 'employee_id', 'date_of_joining', 'created_at'])
    .optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
};
