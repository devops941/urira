import { z } from 'zod';
import { ActivitySource } from './activity.model.js';

export const CreateActivitySchema = z.object({
  activityType: z.string().default('WALKING'),
  steps: z.number().int().min(0, 'Steps must be at least 0'),
  distanceKm: z.number().min(0).optional(),
  activeDurationMinutes: z.number().min(0).optional(),
  estimatedCalories: z.number().min(0).optional(),
  source: z.nativeEnum(ActivitySource).default(ActivitySource.MANUAL),
  deviceIdentifier: z.string().optional(),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().max(300).optional(),
});

export const UpdateActivitySchema = z.object({
  steps: z.number().int().min(0).optional(),
  distanceKm: z.number().min(0).optional(),
  activeDurationMinutes: z.number().min(0).optional(),
  estimatedCalories: z.number().min(0).optional(),
  notes: z.string().max(300).optional(),
});

export const QueryActivityHistorySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;
export type QueryActivityHistoryInput = z.infer<typeof QueryActivityHistorySchema>;

