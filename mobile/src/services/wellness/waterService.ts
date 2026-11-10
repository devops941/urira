import { apiClient } from '../api/axiosInstance';
import {
  IWaterTodaySummary,
  IWeeklyWater,
  IWaterRangeSummary,
  BeverageType,
  IWaterLog,
} from '../../types/wellness';

export const waterService = {
  async logWater(data: {
    quantityMl?: number;
    amountMl?: number;
    beverageType?: BeverageType | string;
    beverageName?: string;
    notes?: string;
    dateString?: string;
  }): Promise<{ log: IWaterLog; todaySummary: IWaterTodaySummary }> {
    const payload = {
      quantityMl: data.quantityMl || data.amountMl || 250,
      beverageType: data.beverageType === 'TEA' || data.beverageType === 'COFFEE' ? 'TEA_COFFEE' : data.beverageType || 'WATER',
      notes: data.notes || data.beverageName,
      dateString: data.dateString,
    };
    const res = await apiClient.post('/water', payload);
    return res.data.data;
  },

  async logIntake(data: any): Promise<any> {
    return this.logWater(data);
  },

  async getTodaySummary(targetDate?: string): Promise<IWaterTodaySummary> {
    const url = targetDate ? `/water/today?date=${targetDate}` : '/water/today';
    const res = await apiClient.get(url);
    return res.data.data;
  },

  async getRangeSummary(startDate: string, endDate: string): Promise<IWaterRangeSummary> {
    const res = await apiClient.get(`/water/range?startDate=${startDate}&endDate=${endDate}`);
    return res.data.data;
  },

  async getWeeklySummary(): Promise<IWeeklyWater> {
    const res = await apiClient.get('/water/summary');
    return res.data.data;
  },

  async getWeeklyHistory(): Promise<any[]> {
    const summary = await this.getWeeklySummary();
    return summary?.history || [];
  },

  async updateWaterGoal(data: {
    targetMl?: number;
    reminderEnabled?: boolean;
    reminderIntervalMinutes?: number;
  }): Promise<any> {
    const res = await apiClient.patch('/water/goal', data);
    return res.data.data;
  },

  async deleteWaterLog(id: string): Promise<any> {
    const res = await apiClient.delete(`/water/${id}`);
    return res.data.data;
  },

  async deleteLog(id: string): Promise<any> {
    return this.deleteWaterLog(id);
  },
};
