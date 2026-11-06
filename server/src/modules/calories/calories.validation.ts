import { z } from 'zod';

export const estimateCaloriesSchema = z.object({
  age: z.number().min(1).max(120).optional(),
  biologicalSex: z.enum(['MALE', 'FEMALE']).optional(),
  heightCm: z.number().min(30).max(300).optional(),
  weightKg: z.number().min(2).max(500).optional(),
  activityLevel: z.enum([
    'SEDENTARY',
    'LIGHTLY_ACTIVE',
    'MODERATELY_ACTIVE',
    'VERY_ACTIVE',
    'EXTRA_ACTIVE',
  ]),
  goal: z.enum(['MAINTAIN_WEIGHT', 'LOSE_WEIGHT', 'GAIN_WEIGHT']),
  notes: z.string().trim().max(500).optional(),
});

