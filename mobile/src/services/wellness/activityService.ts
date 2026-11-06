import { apiClient } from '../api/axiosInstance';
import {
  IActivityTodaySummary,
  IWeeklyActivity,
  IActivityRecord,
  ActivitySource,
} from '../../types/wellness';

export const activityService = {
  async logActivity(data: {
    steps: number;
    activityType?: string;
    distanceKm?: number;
    activeDurationMinutes?: number;
    estimatedCalories?: number;
    source?: ActivitySource;
    notes?: string;
  }): Promise<{ record: IActivityRecord; todaySummary: IActivityTodaySummary }> {
    const res = await apiClient.post('/activity', data);
    return res.data.data;
  },

  async getTodaySummary(): Promise<IActivityTodaySummary> {
    const res = await apiClient.get('/activity/today');
    return res.data.data;
  },

  async getWeeklyTrends(): Promise<IWeeklyActivity> {
    const res = await apiClient.get('/activity/weekly');
    return res.data.data;
  },

  async getHistory(params?: { startDate?: string; endDate?: string }): Promise<IActivityRecord[]> {
    const res = await apiClient.get('/activity/history', { params });
    return res.data.data.records;
  },
};

