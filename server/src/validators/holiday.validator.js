const { z } = require('zod');
const { HOLIDAY_TYPE } = require('../config/constants');

const holidayTypeValues = Object.values(HOLIDAY_TYPE);

const createHolidaySchema = z.object({
  name: z.string()
    .min(1, 'Holiday name is required')
    .max(200, 'Name must be 200 characters or less'),
  date: z.string().date('date must be a valid date (YYYY-MM-DD)'),
  type: z.enum(holidayTypeValues, {
    errorMap: () => ({ message: `type must be one of: ${holidayTypeValues.join(', ')}` }),
  }),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

const updateHolidaySchema = z.object({
  name: z.string()
    .min(1, 'Holiday name is required')
    .max(200, 'Name must be 200 characters or less')
    .optional(),
  date: z.string().date('date must be a valid date (YYYY-MM-DD)').optional(),
  type: z.enum(holidayTypeValues, {
    errorMap: () => ({ message: `type must be one of: ${holidayTypeValues.join(', ')}` }),
  }).optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  is_active: z.boolean().optional(),
});

module.exports = {
  createHolidaySchema,
  updateHolidaySchema,
};
