import { z } from 'zod';
import { BeverageType } from './water.model.js';

export const CreateWaterLogSchema = z.object({
  quantityMl: z.number().positive('Quantity must be greater than 0').max(5000),
  beverageType: z.nativeEnum(BeverageType).default(BeverageType.WATER),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().max(200).optional(),
});

export const UpdateWaterGoalSchema = z.object({
  targetMl: z.number().min(500).max(10000).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderIntervalMinutes: z.number().min(30).max(360).optional(),
});

export const QueryWaterHistorySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateWaterLogInput = z.infer<typeof CreateWaterLogSchema>;
export type UpdateWaterGoalInput = z.infer<typeof UpdateWaterGoalSchema>;
export type QueryWaterHistoryInput = z.infer<typeof QueryWaterHistorySchema>;

