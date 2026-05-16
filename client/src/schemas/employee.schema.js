import { z } from 'zod';

export const createEmployeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z.string().optional().nullable(),
  employee_id: z.string().min(1, 'Employee ID is required'),
  department_id: z.string().optional().nullable(),
  role_id: z.string().min(1, 'Role is required'),
  designation: z.string().optional().nullable(),
  date_of_joining: z.string().optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();
