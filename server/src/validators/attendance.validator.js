const { z } = require('zod');
const { ATTENDANCE_STATUS } = require('../config/constants');

/**
 * Attendance validation schemas (Zod)
 */

const latitudeSchema = z.number({ required_error: 'Latitude is required' })
  .min(-90, 'Latitude must be between -90 and 90')
  .max(90, 'Latitude must be between -90 and 90');

const longitudeSchema = z.number({ required_error: 'Longitude is required' })
  .min(-180, 'Longitude must be between -180 and 180')
  .max(180, 'Longitude must be between -180 and 180');

const checkInSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  note: z.string().max(500, 'Note must be 500 characters or less').optional(),
  device_info: z.object({}).passthrough().optional(),
});

const checkOutSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  note: z.string().max(500, 'Note must be 500 characters or less').optional(),
});

const attendanceStatusValues = Object.values(ATTENDANCE_STATUS);

const getHistorySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  start_date: z.string().date('start_date must be a valid date (YYYY-MM-DD)').optional(),
  end_date: z.string().date('end_date must be a valid date (YYYY-MM-DD)').optional(),
  status: z.enum(attendanceStatusValues, {
    errorMap: () => ({ message: `status must be one of: ${attendanceStatusValues.join(', ')}` }),
  }).optional(),
});

const manualEntrySchema = z.object({
  user_id: z.string().uuid('user_id must be a valid UUID'),
  date: z.string().date('date must be a valid date (YYYY-MM-DD)'),
  check_in_time: z.string().min(1, 'check_in_time is required'),
  check_out_time: z.string().optional(),
  status: z.enum(attendanceStatusValues, {
    errorMap: () => ({ message: `status must be one of: ${attendanceStatusValues.join(', ')}` }),
  }),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

module.exports = {
  checkInSchema,
  checkOutSchema,
  getHistorySchema,
  manualEntrySchema,
};
