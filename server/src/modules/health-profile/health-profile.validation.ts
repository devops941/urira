import { z } from 'zod';

export const updateHealthProfileSchema = z.object({
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
  dateOfBirth: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date of birth format',
    })
    .optional(),
  biologicalSex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  profilePhoto: z.string().url().or(z.literal('')).optional(),
  heightCm: z.number().min(30, 'Height must be at least 30 cm').max(300, 'Height cannot exceed 300 cm').optional(),
  weightKg: z.number().min(2, 'Weight must be at least 2 kg').max(500, 'Weight cannot exceed 500 kg').optional(),
  targetWeightKg: z.number().min(2).max(500).optional().nullable(),
  preferredUnit: z.enum(['METRIC', 'IMPERIAL']).optional(),
  activityLevel: z
    .enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'])
    .optional(),
  healthGoal: z
    .enum(['MAINTAIN_WEIGHT', 'LOSE_WEIGHT', 'GAIN_WEIGHT', 'GENERAL_WELLNESS'])
    .optional(),
  preferredWaterIntakeMl: z.number().min(500).max(10000).optional(),
  preferredStepGoal: z.number().min(1000).max(100000).optional(),
  preferredSleepGoalHours: z.number().min(4).max(16).optional(),
  preferredDailyCalorieGoal: z.number().min(500).max(10000).optional().nullable(),
  emergencyContactName: z.string().trim().max(100).optional().nullable(),
  emergencyContactPhone: z.string().trim().max(25).optional().nullable(),
  medicalNotes: z.string().trim().max(2000).optional().nullable(),
});

