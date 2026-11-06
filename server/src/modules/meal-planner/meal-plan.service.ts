import { Types } from 'mongoose';
import {
  MealPlan,
  IMealPlanDocument,
  MealPlanDuration,
  MealPlanStatus,
} from './meal-plan.model.js';
import { AIMealPlannerService } from './ai-meal-planner.service.js';
import { FoodService } from '../foods/food.service.js';
import { FoodLogService } from '../food-logs/food-log.service.js';
import { convertToGrams } from '../../shared/nutrition/serving-converter.js';
import { calculateNutrientsForWeight } from '../../shared/nutrition/nutrient-calculator.js';
import { MealType } from '../food-logs/food-log.model.js';

export class MealPlanService {
  private aiPlanner: AIMealPlannerService;
  private foodService: FoodService;
  private foodLogService: FoodLogService;

  constructor() {
    this.aiPlanner = new AIMealPlannerService();
    this.foodService = new FoodService();
    this.foodLogService = new FoodLogService();
  }

  async generateMealPlan(
    userId: string,
    options: { duration: MealPlanDuration; title?: string }
  ): Promise<IMealPlanDocument> {
    const generated = await this.aiPlanner.generateMealPlan(userId, options);

    const plan = await MealPlan.create({
      userId: new Types.ObjectId(userId),
      title: generated.title,
      duration: generated.duration,
      startDate: generated.startDate,
      endDate: generated.endDate,
      status: MealPlanStatus.DRAFT,
      aiGenerated: true,
      days: generated.days,
      generalNotes: generated.generalNotes,
      disclaimer: generated.disclaimer,
    });

    return plan;
  }

  async getUserMealPlans(userId: string): Promise<IMealPlanDocument[]> {
    return MealPlan.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getMealPlanById(id: string, userId: string): Promise<IMealPlanDocument | null> {
    return MealPlan.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();
  }

  async approveMealPlan(id: string, userId: string): Promise<IMealPlanDocument | null> {
    return MealPlan.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: { status: MealPlanStatus.APPROVED } },
      { new: true }
    ).exec();
  }

  async swapFood(
    id: string,
    userId: string,
    params: {
      dayIndex: number;
      mealType: MealType;
      oldFoodId: string;
      newFoodId: string;
    }
  ): Promise<IMealPlanDocument | null> {
    const plan = await this.getMealPlanById(id, userId);
    if (!plan) throw new Error('Meal plan not found');

    const newFood = await this.foodService.getFoodById(params.newFoodId);
    if (!newFood) throw new Error('New food item not found');

    const day = plan.days.find((d) => d.dayIndex === params.dayIndex);
    if (!day) throw new Error('Day not found in meal plan');

    const meal = day.meals.find((m) => m.mealType === params.mealType);
    if (!meal) throw new Error('Meal not found in day');

    const foodIndex = meal.foods.findIndex(
      (f) => f.foodId.toString() === params.oldFoodId
    );
    if (foodIndex === -1) throw new Error('Old food not found in meal');

    // Compute replacement food nutrients
    const quantity = newFood.defaultServingSize || 1;
    const unit = newFood.defaultServingUnit || 'serving';
    const weightGrams = convertToGrams(newFood, quantity, unit);
    const nutrients = calculateNutrientsForWeight(newFood.nutrientsPer100g, weightGrams);

    meal.foods[foodIndex] = {
      foodId: newFood._id as any,
      name: newFood.name,
      quantity,
      unit,
      weightGrams,
      calories: nutrients.calories,
      protein: nutrients.protein,
      carbohydrates: nutrients.carbohydrates,
      fat: nutrients.fat,
    };

    // Recalculate meal totals
    meal.totalMealCalories = Math.round(
      meal.foods.reduce((sum, f) => sum + f.calories, 0)
    );
    meal.totalMealProtein =
      Math.round(meal.foods.reduce((sum, f) => sum + f.protein, 0) * 10) / 10;
    meal.totalMealCarbs =
      Math.round(meal.foods.reduce((sum, f) => sum + f.carbohydrates, 0) * 10) / 10;
    meal.totalMealFat =
      Math.round(meal.foods.reduce((sum, f) => sum + f.fat, 0) * 10) / 10;

    // Recalculate day totals
    day.totalDayCalories = Math.round(
      day.meals.reduce((sum, m) => sum + m.totalMealCalories, 0)
    );
    day.totalDayProtein =
      Math.round(day.meals.reduce((sum, m) => sum + m.totalMealProtein, 0) * 10) / 10;
    day.totalDayCarbs =
      Math.round(day.meals.reduce((sum, m) => sum + m.totalMealCarbs, 0) * 10) / 10;
    day.totalDayFat =
      Math.round(day.meals.reduce((sum, m) => sum + m.totalMealFat, 0) * 10) / 10;

    plan.markModified('days');
    await plan.save();
    return plan;
  }

  async logMealToFoodLog(
    id: string,
    userId: string,
    dayIndex: number,
    mealType: MealType
  ) {
    const plan = await this.getMealPlanById(id, userId);
    if (!plan) throw new Error('Meal plan not found');

    const day = plan.days.find((d) => d.dayIndex === dayIndex);
    if (!day) throw new Error('Day not found in meal plan');

    const meal = day.meals.find((m) => m.mealType === mealType);
    if (!meal) throw new Error('Meal not found in day');

    const loggedItems = [];
    for (const food of meal.foods) {
      const res = await this.foodLogService.addFoodLog(userId, {
        foodId: food.foodId.toString(),
        mealType,
        quantity: food.quantity,
        unit: food.unit,
        notes: `Logged from ${plan.title}`,
      });
      loggedItems.push(res.log);
    }

    meal.isLogged = true;
    plan.markModified('days');
    await plan.save();

    return {
      message: `Successfully logged ${meal.foods.length} items to ${mealType}`,
      loggedItems,
      plan,
    };
  }

  async calculateSubstitutionDelta(
    id: string,
    userId: string,
    params: {
      dayIndex: number;
      mealType: MealType;
      oldFoodId: string;
      newFoodId: string;
    }
  ) {
    const plan = await this.getMealPlanById(id, userId);
    if (!plan) throw new Error('Meal plan not found');

    const day = plan.days.find((d) => d.dayIndex === params.dayIndex);
    if (!day) throw new Error('Day not found in meal plan');

    const meal = day.meals.find((m) => m.mealType === params.mealType);
    if (!meal) throw new Error('Meal not found in day');

    const oldItem = meal.foods.find((f) => f.foodId.toString() === params.oldFoodId);
    if (!oldItem) throw new Error('Original food not found in meal');

    const newFood = await this.foodService.getFoodById(params.newFoodId);
    if (!newFood) throw new Error('Replacement food not found');

    const quantity = newFood.defaultServingSize || 1;
    const unit = newFood.defaultServingUnit || 'serving';
    const weightGrams = convertToGrams(newFood, quantity, unit);
    const newNutrients = calculateNutrientsForWeight(newFood.nutrientsPer100g, weightGrams);

    return {
      originalFood: {
        id: oldItem.foodId.toString(),
        name: oldItem.name,
        quantity: oldItem.quantity,
        unit: oldItem.unit,
        calories: oldItem.calories,
        protein: oldItem.protein,
        carbohydrates: oldItem.carbohydrates,
        fat: oldItem.fat,
      },
      replacementFood: {
        id: newFood._id.toString(),
        name: newFood.name,
        quantity,
        unit,
        calories: newNutrients.calories,
        protein: newNutrients.protein,
        carbohydrates: newNutrients.carbohydrates,
        fat: newNutrients.fat,
      },
      delta: {
        calories: Math.round(newNutrients.calories - oldItem.calories),
        protein: Math.round((newNutrients.protein - oldItem.protein) * 10) / 10,
        carbohydrates: Math.round((newNutrients.carbohydrates - oldItem.carbohydrates) * 10) / 10,
        fat: Math.round((newNutrients.fat - oldItem.fat) * 10) / 10,
      },
      isAllergenFree: true,
    };
  }

  async rateMeal(
    id: string,
    userId: string,
    params: {
      dayIndex: number;
      mealType: MealType;
      rating: 'LOVED_IT' | 'GOOD' | 'AVERAGE' | 'NOT_PREFERRED';
      comment?: string;
    }
  ): Promise<IMealPlanDocument | null> {
    const plan = await this.getMealPlanById(id, userId);
    if (!plan) throw new Error('Meal plan not found');

    if (!plan.ratings) plan.ratings = [];

    // Replace or add rating
    const existingIndex = plan.ratings.findIndex(
      (r) => r.dayIndex === params.dayIndex && r.mealType === params.mealType
    );

    const newRating = {
      dayIndex: params.dayIndex,
      mealType: params.mealType,
      rating: params.rating,
      comment: params.comment,
      createdAt: new Date(),
    };

    if (existingIndex >= 0) {
      plan.ratings[existingIndex] = newRating;
    } else {
      plan.ratings.push(newRating);
    }

    plan.markModified('ratings');
    await plan.save();
    return plan;
  }

  async saveAsTemplate(
    id: string,
    userId: string,
    templateName: string
  ): Promise<IMealPlanDocument> {
    const plan = await this.getMealPlanById(id, userId);
    if (!plan) throw new Error('Meal plan not found');

    const template = await MealPlan.create({
      userId: new Types.ObjectId(userId),
      title: `${templateName.trim()} (Template)`,
      templateName: templateName.trim(),
      isTemplate: true,
      duration: plan.duration,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: MealPlanStatus.APPROVED,
      aiGenerated: plan.aiGenerated,
      days: plan.days,
      generalNotes: plan.generalNotes,
      disclaimer: plan.disclaimer,
    });

    return template;
  }

  async getTemplates(userId: string): Promise<IMealPlanDocument[]> {
    return MealPlan.find({
      userId: new Types.ObjectId(userId),
      isTemplate: true,
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  async applyTemplate(templateId: string, userId: string): Promise<IMealPlanDocument> {
    const template = await MealPlan.findOne({
      _id: new Types.ObjectId(templateId),
      userId: new Types.ObjectId(userId),
      isTemplate: true,
    });
    if (!template) throw new Error('Template not found');

    const todayStr = new Date().toISOString().split('T')[0];
    const newDays = template.days.map((d, idx) => {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() + idx);
      return {
        ...d,
        date: dayDate.toISOString().split('T')[0],
        meals: d.meals.map((m) => ({ ...m, isLogged: false })),
      };
    });

    const activePlan = await MealPlan.create({
      userId: new Types.ObjectId(userId),
      title: template.templateName || template.title.replace(' (Template)', ''),
      duration: template.duration,
      startDate: todayStr,
      endDate: newDays[newDays.length - 1]?.date || todayStr,
      status: MealPlanStatus.ACTIVE,
      aiGenerated: false,
      days: newDays,
      generalNotes: template.generalNotes,
      disclaimer: template.disclaimer,
    });

    return activePlan;
  }

  async deleteMealPlan(id: string, userId: string): Promise<boolean> {
    const res = await MealPlan.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    return (res.deletedCount || 0) > 0;
  }
}

