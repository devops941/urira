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
}

