import { z } from 'zod';
import { MealType } from './food-log.model.js';

export const CreateFoodLogSchema = z.object({
  foodId: z.string().min(1, 'foodId is required'),
  mealType: z.nativeEnum(MealType),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  consumedAt: z.string().datetime().optional(),
  notes: z.string().max(300).optional(),
});

export const UpdateFoodLogSchema = z.object({
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  mealType: z.nativeEnum(MealType).optional(),
  consumedAt: z.string().datetime().optional(),
  notes: z.string().max(300).optional(),
});

export const QueryFoodLogHistorySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mealType: z.nativeEnum(MealType).optional(),
});

export const CreateManualFoodLogSchema = z.object({
  foodName: z.string().min(2, 'Food name must be at least 2 characters').max(100),
  mealType: z.nativeEnum(MealType),
  quantity: z.number().positive('Quantity must be greater than 0').default(1),
  unit: z.string().min(1, 'Unit is required').default('serving'),
  weightGrams: z.number().positive().optional(),
  calories: z.number().min(0, 'Calories cannot be negative'),
  protein: z.number().min(0).default(0),
  carbohydrates: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
  fiber: z.number().min(0).default(0),
  consumedAt: z.string().datetime().optional(),
  notes: z.string().max(300).optional(),
  saveToCustomFoods: z.boolean().default(true),
});

export type CreateFoodLogInput = z.infer<typeof CreateFoodLogSchema>;
export type CreateManualFoodLogInput = z.infer<typeof CreateManualFoodLogSchema>;
export type UpdateFoodLogInput = z.infer<typeof UpdateFoodLogSchema>;
export type QueryFoodLogHistoryInput = z.infer<typeof QueryFoodLogHistorySchema>;

