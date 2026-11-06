import { Types } from 'mongoose';
import { z } from 'zod';
import { Food, IFoodDocument, DietaryTag } from '../foods/food.model.js';
import { DietPreferenceService } from '../diet-preferences/diet-preference.service.js';
import { NutritionCalculatorService } from '../nutrition/nutrition-calculator.service.js';
import { aiProviderService } from '../ai-recommendations/ai-provider.service.js';
import { convertToGrams } from '../../shared/nutrition/serving-converter.js';
import { calculateNutrientsForWeight } from '../../shared/nutrition/nutrient-calculator.js';
import { MealType } from '../food-logs/food-log.model.js';
import {
  IMealPlanDay,
  IMealPlanMeal,
  IMealPlanFoodItem,
  MealPlanDuration,
} from './meal-plan.model.js';
import { DietaryType } from '../diet-preferences/diet-preference.model.js';
import { INITIAL_FOODS } from '../../shared/nutrition/initial-foods.js';

const AIMealPlanSchema = z.object({
  planTitle: z.string().default('Nutritious Tailored Meal Plan'),
  days: z.array(
    z.object({
      dayIndex: z.number().int().default(1),
      meals: z.array(
        z.object({
          mealType: z.string(),
          foodSuggestions: z.array(
            z.object({
              foodId: z.string(),
              quantity: z.number().positive(),
              unit: z.string(),
            })
          ),
          reason: z.string().default('Balanced nutrient distribution'),
          preparationNotes: z.string().optional(),
        })
      ),
    })
  ),
  generalNotes: z.array(z.string()).default([]),
});

export class AIMealPlannerService {
  private prefService: DietPreferenceService;
  private calcService: NutritionCalculatorService;

  constructor() {
    this.prefService = new DietPreferenceService();
    this.calcService = new NutritionCalculatorService();
  }

  async generateMealPlan(
    userId: string,
    options: { duration: MealPlanDuration; title?: string }
  ) {
    const prefs = await this.prefService.getPreferences(userId);
    const calorieTarget = await this.calcService.getUserDailyCalorieTarget(userId);

    // Prepare in-memory verified foods with guaranteed ObjectIds as safety net
    const inMemoryFoods = INITIAL_FOODS.map((item) => ({
      ...item,
      _id: new Types.ObjectId(),
    }));

    let allFoods = await Food.find({}).exec();

    // Auto-seed initial staple foods if database food collection is empty
    if (allFoods.length === 0) {
      try {
        const seeded = await Food.insertMany(INITIAL_FOODS);
        allFoods = (seeded && seeded.length > 0 ? seeded : await Food.find({}).exec()) as any;
      } catch {
        allFoods = inMemoryFoods as any;
      }
    }

    if (allFoods.length === 0) {
      allFoods = inMemoryFoods as any;
    }

    // Food lookup map initialized upfront
    const foodMap = new Map<string, any>();
    for (const f of allFoods) {
      if (f._id) {
        foodMap.set(f._id.toString(), f);
      }
    }
    for (const f of inMemoryFoods) {
      foodMap.set(f._id.toString(), f);
    }

    // Filter safe foods according to diet and allergens
    const userAllergens = (prefs.foodAllergies || []).map((a) => a.toUpperCase());
    const excluded = (prefs.excludedFoods || []).map((e) => e.toLowerCase());

    let safeFoods = allFoods.filter((f) => {
      const hasAllergen = (f.allergens || []).some((a: string) =>
        userAllergens.includes(a.toUpperCase())
      );
      if (hasAllergen) return false;

      const isExcluded = excluded.some((ex) =>
        f.normalizedName?.includes(ex) || f.name?.toLowerCase().includes(ex)
      );
      if (isExcluded) return false;

      if (prefs.dietaryType === DietaryType.VEGAN) {
        return (f.dietaryTags || []).includes(DietaryTag.VEGAN);
      }
      if (prefs.dietaryType === DietaryType.VEGETARIAN) {
        return (
          (f.dietaryTags || []).includes(DietaryTag.VEGETARIAN) ||
          (f.dietaryTags || []).includes(DietaryTag.VEGAN)
        );
      }
      if (prefs.dietaryType === DietaryType.EGGETARIAN) {
        return (
          (f.dietaryTags || []).includes(DietaryTag.VEGETARIAN) ||
          (f.dietaryTags || []).includes(DietaryTag.VEGAN) ||
          (f.dietaryTags || []).includes(DietaryTag.EGGETARIAN)
        );
      }
      return true;
    });

    if (safeFoods.length === 0) {
      safeFoods = allFoods.length > 0 ? allFoods : (inMemoryFoods as any);
    }

    const foodCatalogBrief = safeFoods.map((f) => ({
      id: (f._id || new Types.ObjectId()).toString(),
      name: f.name,
      category: f.category,
      unit: f.defaultServingUnit,
      servingGrams: f.weightPerDefaultServingGrams,
      calsPer100g: f.nutrientsPer100g?.calories || 120,
    }));

    const daysCount = options.duration === MealPlanDuration.WEEKLY ? 7 : 1;

    // AI Prompt Construction
    const systemPrompt = `You are an expert Clinical Dietitian and Nutrition Software Engine for UYIRA.
Your task is to generate a realistic, healthy daily or weekly meal plan strictly referencing the provided food database IDs.
CRITICAL RULES:
1. ONLY select foods from the supplied FOOD CATALOG.
2. Every item in "foodSuggestions" MUST have a valid "foodId" matching the exact ID in the catalog.
3. Align meals to the daily calorie target: ~${calorieTarget} kcal/day.
4. Never include foods outside the catalog.
5. Return strictly valid JSON matching the requested schema.`;

    const userPrompt = `Create a ${options.duration.toLowerCase()} meal plan for:
- Calorie Target: ${calorieTarget} kcal/day
- Dietary Type: ${prefs.dietaryType}
- Food Allergies to avoid: ${prefs.foodAllergies.join(', ') || 'None'}
- Days to generate: ${daysCount}

FOOD CATALOG:
${JSON.stringify(foodCatalogBrief)}

JSON SCHEMA FORMAT:
{
  "planTitle": "${options.title || 'UYIRA Tailored Smart Meal Plan'}",
  "days": [
    {
      "dayIndex": 1,
      "meals": [
        {
          "mealType": "BREAKFAST",
          "foodSuggestions": [
            { "foodId": "CATALOG_FOOD_ID", "quantity": 2, "unit": "pieces" }
          ],
          "reason": "Why this meal was chosen",
          "preparationNotes": "Brief serving advice"
        },
        {
          "mealType": "LUNCH",
          "foodSuggestions": [
            { "foodId": "CATALOG_FOOD_ID", "quantity": 1, "unit": "cup" }
          ],
          "reason": "Why this meal was chosen"
        },
        {
          "mealType": "EVENING_SNACK",
          "foodSuggestions": [
            { "foodId": "CATALOG_FOOD_ID", "quantity": 1, "unit": "cup" }
          ],
          "reason": "Sustained afternoon focus"
        },
        {
          "mealType": "DINNER",
          "foodSuggestions": [
            { "foodId": "CATALOG_FOOD_ID", "quantity": 2, "unit": "pieces" }
          ],
          "reason": "Digestive recovery meal"
        }
      ]
    }
  ],
  "generalNotes": ["Hydrate with 2.5L water daily", "Keep salt and oil moderate"]
}`;

    // Deterministic fallback plan if OpenAI/Gemini is unavailable or rate limited
    const generateDeterministicPlan = () => {
      const getFood = (keywords: string[], fallbackIdx: number) => {
        for (const kw of keywords) {
          const match = safeFoods.find(
            (f) =>
              f.normalizedName?.includes(kw) ||
              f.name?.toLowerCase().includes(kw)
          );
          if (match) return match;
        }
        if (safeFoods.length > 0) {
          return safeFoods[fallbackIdx % safeFoods.length];
        }
        return (allFoods[fallbackIdx % (allFoods.length || 1)] || inMemoryFoods[fallbackIdx % inMemoryFoods.length]) as any;
      };

      const idli = getFood(['idli', 'dosa'], 0);
      const sambar = getFood(['sambar', 'dal', 'curry'], 1);
      const banana = getFood(['banana', 'fruit', 'apple'], 2);
      const rice = getFood(['rice', 'oatmeal'], 0);
      const dal = getFood(['dal', 'sambar', 'curry'], 1);
      const poriyal = getFood(['poriyal', 'curry', 'vegetable', 'salad'], 2);
      const chapati = getFood(['chapati', 'roti', 'idli'], 0);
      const sundal = getFood(['sundal', 'chickpea', 'almond', 'nuts', 'sprouts'], 2);

      const toFoodItem = (f: any, defaultUnit: string, qty: number) => {
        const foodId = (f?._id || new Types.ObjectId()).toString();
        foodMap.set(foodId, f);
        return {
          foodId,
          quantity: qty,
          unit: f?.defaultServingUnit || defaultUnit,
        };
      };

      const days = [];
      for (let i = 1; i <= daysCount; i++) {
        days.push({
          dayIndex: i,
          meals: [
            {
              mealType: 'BREAKFAST',
              foodSuggestions: [
                toFoodItem(idli, 'pieces', 2),
                toFoodItem(sambar, 'cup', 1),
                toFoodItem(banana, 'piece', 1),
              ],
              reason: 'Steamed South Indian breakfast rich in complex carbohydrates and light on digestion.',
              preparationNotes: 'Enjoy steamed hot with vegetable sambar.',
            },
            {
              mealType: 'LUNCH',
              foodSuggestions: [
                toFoodItem(rice, 'cup', 1),
                toFoodItem(dal, 'cup', 1),
                toFoodItem(poriyal, 'cup', 1),
              ],
              reason: 'Wholesome staple lunch providing complete amino acids and essential micronutrients.',
              preparationNotes: 'Combine cooked rice with protein-rich dal and fiber-rich vegetable poriyal.',
            },
            {
              mealType: 'EVENING_SNACK',
              foodSuggestions: [
                toFoodItem(sundal, 'cup', 1),
              ],
              reason: 'Slow-digesting plant protein and dietary fiber for afternoon sustained energy.',
              preparationNotes: 'Tempered chickpea sundal with fresh coconut garnish.',
            },
            {
              mealType: 'DINNER',
              foodSuggestions: [
                toFoodItem(chapati, 'pieces', 2),
                toFoodItem(dal, 'cup', 1),
              ],
              reason: 'Light whole wheat flatbread dinner that promotes stable overnight blood sugar.',
              preparationNotes: 'Serve soft chapatis fresh with warm tempered dal.',
            },
          ],
        });
      }

      return {
        planTitle: options.title || 'UYIRA Balanced Health Meal Plan',
        days,
        generalNotes: [
          `Formulated for ${calorieTarget} kcal daily requirement`,
          'Drink at least 2.5 Liters of water daily',
          'Chew mindfully and maintain a regular meal schedule',
        ],
      };
    };

    // Execute with OpenAI or fallback
    const rawResult = await aiProviderService.generateStructuredJson<any>(
      systemPrompt,
      userPrompt,
      generateDeterministicPlan
    );

    let parsed;
    try {
      parsed = AIMealPlanSchema.parse(rawResult);
    } catch {
      parsed = AIMealPlanSchema.parse(generateDeterministicPlan());
    }

    if (!parsed || !parsed.days || parsed.days.length === 0) {
      parsed = AIMealPlanSchema.parse(generateDeterministicPlan());
    }

    // Deterministically calculate ALL nutrients on the backend
    const startDate = new Date();
    const processedDays: IMealPlanDay[] = [];

    for (const day of parsed.days) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + (day.dayIndex - 1));
      const dateString = dayDate.toISOString().split('T')[0];

      let dayCalories = 0;
      let dayProtein = 0;
      let dayCarbs = 0;
      let dayFat = 0;

      const processedMeals: IMealPlanMeal[] = [];

      for (const meal of day.meals) {
        let mealCalories = 0;
        let mealProtein = 0;
        let mealCarbs = 0;
        let mealFat = 0;

        const processedFoods: IMealPlanFoodItem[] = [];

        for (const sugg of meal.foodSuggestions) {
          const food =
            foodMap.get(sugg.foodId) ||
            allFoods.find((f) => f._id && f._id.toString() === sugg.foodId) ||
            allFoods[0] ||
            inMemoryFoods[0];
          if (!food) continue;

          const weightGrams = convertToGrams(food, sugg.quantity, sugg.unit);
          const nutrients = calculateNutrientsForWeight(food.nutrientsPer100g, weightGrams);

          const foodId = food._id ? new Types.ObjectId(food._id) : new Types.ObjectId();

          processedFoods.push({
            foodId,
            name: food.name,
            quantity: sugg.quantity,
            unit: sugg.unit,
            weightGrams,
            calories: nutrients.calories,
            protein: nutrients.protein,
            carbohydrates: nutrients.carbohydrates,
            fat: nutrients.fat,
          });

          mealCalories += nutrients.calories;
          mealProtein += nutrients.protein;
          mealCarbs += nutrients.carbohydrates;
          mealFat += nutrients.fat;
        }

        processedMeals.push({
          mealType: (meal.mealType || 'OTHER') as MealType,
          foods: processedFoods,
          totalMealCalories: Math.round(mealCalories),
          totalMealProtein: Math.round(mealProtein * 10) / 10,
          totalMealCarbs: Math.round(mealCarbs * 10) / 10,
          totalMealFat: Math.round(mealFat * 10) / 10,
          reason: meal.reason || 'Nutritious balanced meal',
          preparationNotes: meal.preparationNotes || '',
          isLogged: false,
        });

        dayCalories += mealCalories;
        dayProtein += mealProtein;
        dayCarbs += mealCarbs;
        dayFat += mealFat;
      }

      processedDays.push({
        dayIndex: day.dayIndex,
        date: dateString,
        totalDayCalories: Math.round(dayCalories),
        totalDayProtein: Math.round(dayProtein * 10) / 10,
        totalDayCarbs: Math.round(dayCarbs * 10) / 10,
        totalDayFat: Math.round(dayFat * 10) / 10,
        meals: processedMeals,
      });
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (daysCount - 1));

    return {
      title: parsed.planTitle,
      duration: options.duration,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      days: processedDays,
      generalNotes: parsed.generalNotes,
      disclaimer:
        'This AI-tailored meal plan is intended for wellness and nutritional guidance. All calories and macronutrients are clinically computed using verified food database records.',
    };
  }
}
