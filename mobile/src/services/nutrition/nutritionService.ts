import { apiClient } from '../api/axiosInstance';
import { INutritionSummary } from '../../types/nutrition';

export const nutritionService = {
  async getTodaySummary(): Promise<INutritionSummary> {
    const res = await apiClient.get('/nutrition/summary');
    return res.data.data;
  },

  async getDailySummary(date: string): Promise<INutritionSummary> {
    const res = await apiClient.get('/nutrition/daily', { params: { date } });
    return res.data.data;
  },

  async getWeeklySummaries(): Promise<{
    startDate: string;
    endDate: string;
    avgDailyCalories: number;
    dailyTarget: number;
    history: INutritionSummary[];
  }> {
    const res = await apiClient.get('/nutrition/weekly');
    return res.data.data;
  },
};

