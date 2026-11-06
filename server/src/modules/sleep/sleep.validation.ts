import { z } from 'zod';
import { SleepQuality, SleepSource } from './sleep.model.js';

export const CreateSleepSchema = z.object({
  bedtime: z.string().datetime(),
  wakeTime: z.string().datetime(),
  durationMinutes: z.number().min(10).max(1440).optional(),
  sleepQuality: z.nativeEnum(SleepQuality).default(SleepQuality.GOOD),
  source: z.nativeEnum(SleepSource).default(SleepSource.MANUAL),
  notes: z.string().max(300).optional(),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const UpdateSleepSchema = z.object({
  bedtime: z.string().datetime().optional(),
  wakeTime: z.string().datetime().optional(),
  durationMinutes: z.number().min(10).max(1440).optional(),
  sleepQuality: z.nativeEnum(SleepQuality).optional(),
  notes: z.string().max(300).optional(),
});

export const QuerySleepHistorySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateSleepInput = z.infer<typeof CreateSleepSchema>;
export type UpdateSleepInput = z.infer<typeof UpdateSleepSchema>;
export type QuerySleepHistoryInput = z.infer<typeof QuerySleepHistorySchema>;

