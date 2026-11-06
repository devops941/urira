import { z } from 'zod';
import { VitalMetricType, VitalSource } from './vital.model.js';

export const CreateVitalSchema = z
  .object({
    metricType: z.nativeEnum(VitalMetricType),
    value: z.number().optional(),
    systolic: z.number().min(50).max(280).optional(),
    diastolic: z.number().min(30).max(180).optional(),
    unit: z.string().optional(),
    source: z.nativeEnum(VitalSource).default(VitalSource.MANUAL),
    deviceIdentifier: z.string().optional(),
    measuredAt: z.string().datetime().optional(),
    notes: z.string().max(300).optional(),
  })
  .refine(
    (data) => {
      if (data.metricType === VitalMetricType.BLOOD_PRESSURE) {
        return data.systolic !== undefined && data.diastolic !== undefined;
      }
      return data.value !== undefined;
    },
    {
      message: 'Proper measurement values must be provided for the selected vital metric.',
    }
  );

export const QueryVitalHistorySchema = z.object({
  metricType: z.nativeEnum(VitalMetricType).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type CreateVitalInput = z.infer<typeof CreateVitalSchema>;
export type QueryVitalHistoryInput = z.infer<typeof QueryVitalHistorySchema>;

