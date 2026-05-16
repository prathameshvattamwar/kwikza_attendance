import { z } from 'zod';

export const checkInSchema = z.object({
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
});

export const checkOutSchema = z.object({
  notes: z.string().optional(),
});

export const manualEntrySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.string().min(1, 'Status is required'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  reason: z.string().min(1, 'Reason is required'),
});
