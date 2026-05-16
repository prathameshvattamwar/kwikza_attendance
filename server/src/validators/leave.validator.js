const { z } = require('zod');

const applyLeaveSchema = z.object({
  leave_type_id: z.string().uuid('leave_type_id must be a valid UUID'),
  start_date: z.string().date('start_date must be a valid date (YYYY-MM-DD)'),
  end_date: z.string().date('end_date must be a valid date (YYYY-MM-DD)'),
  reason: z.string()
    .min(5, 'Reason must be at least 5 characters')
    .max(1000, 'Reason must be 1000 characters or less'),
});

const rejectLeaveSchema = z.object({
  reason: z.string()
    .min(5, 'Reason must be at least 5 characters')
    .max(1000, 'Reason must be 1000 characters or less'),
});

module.exports = {
  applyLeaveSchema,
  rejectLeaveSchema,
};
