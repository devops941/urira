import { apiClient } from '../api/axiosInstance';
import {
  IFoodLog,
  INutritionSummary,
  IFoodLogRangeSummary,
  MealType,
} from '../../types/nutrition';

export const foodLogService = {
  async addFoodLog(input: {
    foodId: string;
    mealType: MealType;
    quantity: number;
    unit: string;
    notes?: string;
  }): Promise<{ log: IFoodLog; dailySummary: INutritionSummary }> {
    const res = await apiClient.post('/food-logs', input);
    return res.data.data;
  },

  async getTodayLogs(): Promise<{
    date: string;
    summary: INutritionSummary;
    grouped: Record<MealType, IFoodLog[]>;
    logs: IFoodLog[];
  }> {
    const res = await apiClient.get('/food-logs/today');
    return res.data.data;
  },

  async getRangeSummary(startDate: string, endDate: string): Promise<IFoodLogRangeSummary> {
    const res = await apiClient.get(`/food-logs/range?startDate=${startDate}&endDate=${endDate}`);
    return res.data.data;
  },

  async getHistory(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    mealType?: MealType;
  }): Promise<{ logs: IFoodLog[]; summary?: INutritionSummary }> {
    const res = await apiClient.get('/food-logs/history', { params });
    return res.data.data;
  },

  async deleteFoodLog(id: string): Promise<{ success: boolean; summary: INutritionSummary }> {
    const res = await apiClient.delete(`/food-logs/${id}`);
    return res.data.data;
  },
};

