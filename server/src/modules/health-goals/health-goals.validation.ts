import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(120),
  category: z.enum(['WEIGHT', 'BMI', 'STEPS', 'WATER', 'SLEEP', 'CALORIES', 'HABIT']),
  targetValue: z.number().min(0, 'Target value must be greater than or equal to 0'),
  initialValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().trim().min(1, 'Unit is required').max(20),
  startDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid start date' })
    .optional(),
  targetDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Valid target date is required' }),
  notes: z.string().trim().max(1000).optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().trim().min(1).max(20).optional(),
  targetDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid target date' })
    .optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const updateProgressSchema = z.object({
  currentValue: z.number().min(0, 'Current progress value must be positive'),
});

