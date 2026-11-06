import { apiClient } from '../api/axiosInstance';
import {
  IWaterTodaySummary,
  IWeeklyWater,
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
  }): Promise<{ log: IWaterLog; todaySummary: IWaterTodaySummary }> {
    const payload = {
      quantityMl: data.quantityMl || data.amountMl || 250,
      beverageType: data.beverageType === 'TEA' || data.beverageType === 'COFFEE' ? 'TEA_COFFEE' : data.beverageType || 'WATER',
      notes: data.notes || data.beverageName,
    };
    const res = await apiClient.post('/water', payload);
    return res.data.data;
  },

  async logIntake(data: any): Promise<any> {
    return this.logWater(data);
  },

  async getTodaySummary(): Promise<IWaterTodaySummary> {
    const res = await apiClient.get('/water/today');
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
