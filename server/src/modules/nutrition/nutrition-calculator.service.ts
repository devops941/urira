import { FoodRepository } from '../foods/food.repository.js';
import { FoodLogRepository } from '../food-logs/food-log.repository.js';
import { NutritionRepository } from './nutrition.repository.js';
import { HealthProfileModel } from '../health-profile/health-profile.model.js';
import { CalorieRecordModel } from '../calories/calories.model.js';
import { convertToGrams } from '../../shared/nutrition/serving-converter.js';
import {
  calculateNutrientsForWeight,
  aggregateNutrients,
} from '../../shared/nutrition/nutrient-calculator.js';
import { MealType } from '../food-logs/food-log.model.js';
import { INutrients } from '../foods/food.model.js';
import { IMealBreakdown, INutritionSummaryDocument } from './nutrition.model.js';

export class NutritionCalculatorService {
  private foodRepo: FoodRepository;
  private foodLogRepo: FoodLogRepository;
  private nutritionRepo: NutritionRepository;

  constructor() {
    this.foodRepo = new FoodRepository();
    this.foodLogRepo = new FoodLogRepository();
    this.nutritionRepo = new NutritionRepository();
  }

  /**
   * Computes grams and nutrients for a single food item entry
   */
  async computeFoodLogNutrients(
    foodId: string,
    quantity: number,
    unit: string
  ): Promise<{ weightGrams: number; calculatedNutrition: INutrients }> {
    const food = await this.foodRepo.findById(foodId);
    if (!food) {
      throw new Error(`Food item with ID ${foodId} not found`);
    }

    const weightGrams = convertToGrams(food, quantity, unit);
    const calculatedNutrition = calculateNutrientsForWeight(
      food.nutrientsPer100g,
      weightGrams
    );

    return {
      weightGrams,
      calculatedNutrition,
    };
  }

  /**
   * Retrieves the user's active daily calorie target
   * Sources:
   * 1. HealthProfile.targetCalories or preferredDailyCalorieGoal
   * 2. Latest CalorieRecord.targetCalories / maintenanceCalories
   * 3. Fallback: 2000 kcal
   */
  async getUserDailyCalorieTarget(userId: string): Promise<number> {
    try {
      const profile = await HealthProfileModel.findOne({ userId }).exec();
      if (profile && (profile as any).preferredDailyCalorieGoal && (profile as any).preferredDailyCalorieGoal > 500) {
        return (profile as any).preferredDailyCalorieGoal;
      }

      const latestCalorie = await CalorieRecordModel.findOne({ userId })
        .sort({ calculatedAt: -1 })
        .exec();
      if (latestCalorie && latestCalorie.estimatedDailyCalories) {
        return latestCalorie.estimatedDailyCalories;
      }

      // Compute on-the-fly dynamically from biometric health profile
      if (profile && (profile.weightKg || profile.heightCm)) {
        const weightKg = profile.weightKg || 70;
        const heightCm = profile.heightCm || 170;
        const dob = profile.dateOfBirth;
        let age = 25;
        if (dob) {
          const diff = Date.now() - new Date(dob).getTime();
          age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) || 25;
        }
        const isFemale = profile.biologicalSex === 'FEMALE';
        let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (isFemale ? -161 : 5);

        let factor = 1.2;
        const act = (profile.activityLevel || 'SEDENTARY').toUpperCase();
        if (act.includes('EXTRA') || act.includes('VERY')) factor = 1.725;
        else if (act.includes('MODERATE')) factor = 1.55;
        else if (act.includes('LIGHT')) factor = 1.375;

        let tdee = Math.round(bmr * factor);
        const goal = (profile.healthGoal || 'MAINTAIN_WEIGHT').toUpperCase();
        if (goal.includes('LOSE')) tdee = Math.round(tdee - 450);
        else if (goal.includes('GAIN')) tdee = Math.round(tdee + 400);

        const dynamicTarget = Math.max(1200, Math.min(4500, tdee));

        // Persist computed target to profile
        profile.preferredDailyCalorieGoal = dynamicTarget;
        await profile.save().catch(() => {});

        return dynamicTarget;
      }

      return 2000;
    } catch {
      return 2000;
    }
  }

  /**
   * Recalculates and persists the daily nutrition summary for a given user and date
   */
  async recalculateDailySummary(
    userId: string,
    dateString: string
  ): Promise<INutritionSummaryDocument> {
    const logs = await this.foodLogRepo.findByDate(userId, dateString);
    const calorieTarget = await this.getUserDailyCalorieTarget(userId);

    const mealBreakdown: IMealBreakdown = {
      breakfast: 0,
      morningSnack: 0,
      lunch: 0,
      eveningSnack: 0,
      dinner: 0,
      other: 0,
    };

    const nutrientList: INutrients[] = [];

    for (const log of logs) {
      const cals = log.calculatedNutrition.calories || 0;
      nutrientList.push(log.calculatedNutrition);

      switch (log.mealType) {
        case MealType.BREAKFAST:
          mealBreakdown.breakfast += cals;
          break;
        case MealType.MORNING_SNACK:
          mealBreakdown.morningSnack += cals;
          break;
        case MealType.LUNCH:
          mealBreakdown.lunch += cals;
          break;
        case MealType.EVENING_SNACK:
          mealBreakdown.eveningSnack += cals;
          break;
        case MealType.DINNER:
          mealBreakdown.dinner += cals;
          break;
        case MealType.OTHER:
          mealBreakdown.other += cals;
          break;
      }
    }

    const aggregated = aggregateNutrients(nutrientList);
    const consumedCalories = aggregated.calories;
    const remainingCalories = calorieTarget - consumedCalories;

    return this.nutritionRepo.upsertDailySummary(userId, dateString, {
      calorieTarget,
      consumedCalories,
      remainingCalories,
      protein: aggregated.protein,
      carbohydrates: aggregated.carbohydrates,
      fat: aggregated.fat,
      fiber: aggregated.fiber,
      sugar: aggregated.sugar,
      sodium: aggregated.sodium,
      mealBreakdown,
    });
  }
}
