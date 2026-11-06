import { NutritionRepository } from './nutrition.repository.js';
import { NutritionCalculatorService } from './nutrition-calculator.service.js';

export class NutritionService {
  private nutritionRepo: NutritionRepository;
  private calcService: NutritionCalculatorService;

  constructor() {
    this.nutritionRepo = new NutritionRepository();
    this.calcService = new NutritionCalculatorService();
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  async getTodaySummary(userId: string) {
    const today = this.getTodayString();
    return this.calcService.recalculateDailySummary(userId, today);
  }

  async getDailySummary(userId: string, dateString: string) {
    return this.calcService.recalculateDailySummary(userId, dateString);
  }

  async getWeeklySummaries(userId: string) {
    const today = new Date();
    const days: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const startDate = days[0];
    const endDate = days[days.length - 1];

    const summaries = await this.nutritionRepo.getDateRangeSummaries(
      userId,
      startDate,
      endDate
    );

    // Map each day with existing record or zeroed day
    const dayMap = new Map<string, any>();
    for (const s of summaries) {
      dayMap.set(s.date, s);
    }

    const calorieTarget = await this.calcService.getUserDailyCalorieTarget(userId);

    const weeklyData = days.map((date) => {
      if (dayMap.has(date)) {
        return dayMap.get(date);
      }
      return {
        date,
        calorieTarget,
        consumedCalories: 0,
        remainingCalories: calorieTarget,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        mealBreakdown: {
          breakfast: 0,
          morningSnack: 0,
          lunch: 0,
          eveningSnack: 0,
          dinner: 0,
          other: 0,
        },
      };
    });

    const totalConsumed = weeklyData.reduce(
      (sum, d) => sum + (d.consumedCalories || 0),
      0
    );
    const avgDailyCalories = Math.round(totalConsumed / 7);

    return {
      startDate,
      endDate,
      avgDailyCalories,
      dailyTarget: calorieTarget,
      history: weeklyData,
    };
  }

  async getTrends(userId: string) {
    return this.getWeeklySummaries(userId);
  }
}

