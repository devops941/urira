import { z } from 'zod';
import { FoodCategory, DietaryTag } from './food.model.js';

export const SearchFoodsSchema = z.object({
  q: z.string().optional(),
  category: z.nativeEnum(FoodCategory).optional(),
  dietaryTag: z.nativeEnum(DietaryTag).optional(),
  maxCalories: z.coerce.number().positive().optional(),
  minCalories: z.coerce.number().min(0).optional(),
  minProtein: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreateFoodSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.nativeEnum(FoodCategory),
  description: z.string().max(500).default(''),
  imageUrl: z.string().url().optional(),
  defaultServingSize: z.number().positive().default(1),
  defaultServingUnit: z.string().min(1).default('serving'),
  weightPerDefaultServingGrams: z.number().positive().default(100),
  availableServings: z
    .array(
      z.object({
        unit: z.string().min(1),
        servingSize: z.number().positive(),
        weightGrams: z.number().positive(),
      })
    )
    .optional(),
  nutrientsPer100g: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbohydrates: z.number().min(0),
    fat: z.number().min(0),
    fiber: z.number().min(0).default(0),
    sugar: z.number().min(0).default(0),
    sodium: z.number().min(0).default(0),
  }),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  dietaryTags: z.array(z.nativeEnum(DietaryTag)).default([]),
  preparationMethod: z.string().optional(),
  source: z.string().default('Internal Database'),
  isVerified: z.boolean().default(true),
});

export type SearchFoodsInput = z.infer<typeof SearchFoodsSchema>;
export type CreateFoodInput = z.infer<typeof CreateFoodSchema>;

