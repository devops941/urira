import { z } from 'zod';

export const calculateBmiSchema = z.object({
  heightCm: z.number().min(30, 'Height must be at least 30 cm').max(300, 'Height cannot exceed 300 cm').optional(),
  weightKg: z.number().min(2, 'Weight must be at least 2 kg').max(500, 'Weight cannot exceed 500 kg').optional(),
  heightFeet: z.number().min(1).max(8).optional(),
  heightInches: z.number().min(0).max(11.99).optional(),
  weightLbs: z.number().min(4).max(1100).optional(),
  unitSystem: z.enum(['METRIC', 'IMPERIAL']).default('METRIC'),
  userAge: z.number().min(1).max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

