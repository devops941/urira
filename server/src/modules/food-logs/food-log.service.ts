import { FoodLogRepository } from './food-log.repository.js';
import { NutritionCalculatorService } from '../nutrition/nutrition-calculator.service.js';
import { CreateFoodLogInput, UpdateFoodLogInput } from './food-log.validation.js';
import { MealType, IFoodLogDocument } from './food-log.model.js';

export class FoodLogService {
  private foodLogRepo: FoodLogRepository;
  private calcService: NutritionCalculatorService;

  constructor() {
    this.foodLogRepo = new FoodLogRepository();
    this.calcService = new NutritionCalculatorService();
  }

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async addFoodLog(userId: string, input: CreateFoodLogInput) {
    const consumedAt = input.consumedAt ? new Date(input.consumedAt) : new Date();
    const dateString = this.getDateString(consumedAt);

    // Compute deterministic weight and nutrients
    const { weightGrams, calculatedNutrition } =
      await this.calcService.computeFoodLogNutrients(
        input.foodId,
        input.quantity,
        input.unit
      );

    const log = await this.foodLogRepo.create({
      userId: userId as any,
      foodId: input.foodId as any,
      mealType: input.mealType,
      quantity: input.quantity,
      unit: input.unit,
      weightGrams,
      calculatedNutrition,
      consumedAt,
      dateString,
      notes: input.notes,
    });

    // Update daily summary in background
    const dailySummary = await this.calcService.recalculateDailySummary(
      userId,
      dateString
    );

    return { log, dailySummary };
  }

  async getTodayLogs(userId: string) {
    const today = this.getDateString(new Date());
    const logs = await this.foodLogRepo.findByDate(userId, today);
    const summary = await this.calcService.recalculateDailySummary(userId, today);

    // Group logs by mealType for clean frontend presentation
    const grouped: Record<MealType, IFoodLogDocument[]> = {
      [MealType.BREAKFAST]: [],
      [MealType.MORNING_SNACK]: [],
      [MealType.LUNCH]: [],
      [MealType.EVENING_SNACK]: [],
      [MealType.DINNER]: [],
      [MealType.OTHER]: [],
    };

    for (const log of logs) {
      if (grouped[log.mealType]) {
        grouped[log.mealType].push(log);
      }
    }

    return {
      date: today,
      summary,
      grouped,
      logs,
    };
  }

  async getHistory(
    userId: string,
    options: { date?: string; startDate?: string; endDate?: string; mealType?: MealType }
  ) {
    if (options.date) {
      const logs = await this.foodLogRepo.findByDate(userId, options.date);
      const summary = await this.calcService.recalculateDailySummary(
        userId,
        options.date
      );
      return { date: options.date, summary, logs };
    }

    const today = this.getDateString(new Date());
    const startDate = options.startDate || today;
    const endDate = options.endDate || today;

    const logs = await this.foodLogRepo.findByDateRange(
      userId,
      startDate,
      endDate,
      options.mealType
    );

    return { startDate, endDate, totalLogs: logs.length, logs };
  }

  async getLogById(id: string, userId: string) {
    return this.foodLogRepo.findById(id, userId);
  }

  async updateFoodLog(id: string, userId: string, input: UpdateFoodLogInput) {
    const existing = await this.foodLogRepo.findById(id, userId);
    if (!existing) {
      throw new Error('Food log not found');
    }

    const updates: Partial<IFoodLogDocument> = {};
    let needRecalc = false;

    if (input.mealType) updates.mealType = input.mealType;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.consumedAt) {
      const newDate = new Date(input.consumedAt);
      updates.consumedAt = newDate;
      updates.dateString = this.getDateString(newDate);
    }

    const quantity = input.quantity ?? existing.quantity;
    const unit = input.unit ?? existing.unit;

    if (input.quantity !== undefined || input.unit !== undefined) {
      needRecalc = true;
      const { weightGrams, calculatedNutrition } =
        await this.calcService.computeFoodLogNutrients(
          existing.foodId._id ? existing.foodId._id.toString() : (existing.foodId as any).toString(),
          quantity,
          unit
        );
      updates.quantity = quantity;
      updates.unit = unit;
      updates.weightGrams = weightGrams;
      updates.calculatedNutrition = calculatedNutrition;
    }

    const updated = await this.foodLogRepo.update(id, userId, updates);

    // Update daily summary
    const dateToUpdate = updates.dateString || existing.dateString;
    const summary = await this.calcService.recalculateDailySummary(
      userId,
      dateToUpdate
    );

    if (updates.dateString && updates.dateString !== existing.dateString) {
      // Also update the old date's summary if moved to a different day
      await this.calcService.recalculateDailySummary(userId, existing.dateString);
    }

    return { log: updated, summary };
  }

  async deleteFoodLog(id: string, userId: string) {
    const existing = await this.foodLogRepo.findById(id, userId);
    if (!existing) {
      throw new Error('Food log not found');
    }

    const dateString = existing.dateString;
    const deleted = await this.foodLogRepo.delete(id, userId);

    const summary = await this.calcService.recalculateDailySummary(
      userId,
      dateString
    );

    return { success: deleted, date: dateString, summary };
  }

  /**
   * Get aggregated Nutrition Range summary for Day / Week / Month / Year / Custom filters
   */
  async getRangeSummary(userId: string, startDate: string, endDate: string) {
    const logs = await this.foodLogRepo.findByDateRange(userId, startDate, endDate);

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const diffDays = Math.max(
      1,
      Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    let totalCalories = 0;
    let totalProteinGrams = 0;
    let totalCarbsGrams = 0;
    let totalFatGrams = 0;
    let totalFiberGrams = 0;

    const mealStats: Record<string, { count: number; calories: number }> = {
      BREAKFAST: { count: 0, calories: 0 },
      MORNING_SNACK: { count: 0, calories: 0 },
      LUNCH: { count: 0, calories: 0 },
      EVENING_SNACK: { count: 0, calories: 0 },
      DINNER: { count: 0, calories: 0 },
      OTHER: { count: 0, calories: 0 },
    };

    const dayMap = new Map<
      string,
      { calories: number; protein: number; carbs: number; fat: number; count: number }
    >();

    for (const log of logs) {
      const cals = log.calculatedNutrition?.calories || 0;
      const prot = log.calculatedNutrition?.protein || 0;
      const carb = log.calculatedNutrition?.carbohydrates || 0;
      const fat = log.calculatedNutrition?.fat || 0;
      const fiber = log.calculatedNutrition?.fiber || 0;

      totalCalories += cals;
      totalProteinGrams += prot;
      totalCarbsGrams += carb;
      totalFatGrams += fat;
      totalFiberGrams += fiber;

      const mType = log.mealType || 'OTHER';
      if (!mealStats[mType]) {
        mealStats[mType] = { count: 0, calories: 0 };
      }
      mealStats[mType].count += 1;
      mealStats[mType].calories += cals;

      const dStr = log.dateString || this.getDateString(new Date(log.consumedAt));
      const curDay = dayMap.get(dStr) || { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      curDay.calories += cals;
      curDay.protein += prot;
      curDay.carbs += carb;
      curDay.fat += fat;
      curDay.count += 1;
      dayMap.set(dStr, curDay);
    }

    const avgDailyCalories = Math.round(totalCalories / diffDays);
    const avgDailyProtein = Math.round((totalProteinGrams / diffDays) * 10) / 10;
    const avgDailyCarbs = Math.round((totalCarbsGrams / diffDays) * 10) / 10;
    const avgDailyFat = Math.round((totalFatGrams / diffDays) * 10) / 10;

    const dailyBreakdown: Array<{
      date: string;
      label: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      loggedMealsCount: number;
    }> = [];

    if (diffDays <= 35) {
      const cur = new Date(startObj);
      while (cur <= endObj) {
        const dStr = this.getDateString(cur);
        const dayStat = dayMap.get(dStr) || { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
        const label = cur.toLocaleDateString('en-US', { weekday: 'narrow' });
        dailyBreakdown.push({
          date: dStr,
          label,
          calories: Math.round(dayStat.calories),
          protein: Math.round(dayStat.protein * 10) / 10,
          carbs: Math.round(dayStat.carbs * 10) / 10,
          fat: Math.round(dayStat.fat * 10) / 10,
          loggedMealsCount: dayStat.count,
        });
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      const monthMap = new Map<
        string,
        { calories: number; protein: number; carbs: number; fat: number; count: number }
      >();
      for (const [dStr, stat] of dayMap.entries()) {
        const ym = dStr.substring(0, 7);
        const curM = monthMap.get(ym) || { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
        curM.calories += stat.calories;
        curM.protein += stat.protein;
        curM.carbs += stat.carbs;
        curM.fat += stat.fat;
        curM.count += stat.count;
        monthMap.set(ym, curM);
      }

      const startYear = parseInt(startDate.substring(0, 4), 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let m = 1; m <= 12; m++) {
        const mPad = m < 10 ? `0${m}` : `${m}`;
        const ym = `${startYear}-${mPad}`;
        const curM = monthMap.get(ym) || { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
        dailyBreakdown.push({
          date: `${ym}-01`,
          label: monthNames[m - 1],
          calories: Math.round(curM.calories),
          protein: Math.round(curM.protein * 10) / 10,
          carbs: Math.round(curM.carbs * 10) / 10,
          fat: Math.round(curM.fat * 10) / 10,
          loggedMealsCount: curM.count,
        });
      }
    }

    return {
      startDate,
      endDate,
      daysCount: diffDays,
      totalCalories: Math.round(totalCalories),
      avgDailyCalories,
      totalProteinGrams: Math.round(totalProteinGrams * 10) / 10,
      totalCarbsGrams: Math.round(totalCarbsGrams * 10) / 10,
      totalFatGrams: Math.round(totalFatGrams * 10) / 10,
      totalFiberGrams: Math.round(totalFiberGrams * 10) / 10,
      avgDailyProtein,
      avgDailyCarbs,
      avgDailyFat,
      mealBreakdown: mealStats,
      dailyBreakdown,
      logs,
    };
  }
}

