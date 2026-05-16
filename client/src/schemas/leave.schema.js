import { z } from 'zod';

export const leaveApplicationSchema = z.object({
  leave_type_id: z.string().min(1, 'Leave type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required'),
});
