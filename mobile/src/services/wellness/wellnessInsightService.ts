import { apiClient } from '../api/axiosInstance';
import { IWellnessInsightResponse } from '../../types/wellness';

export const wellnessInsightService = {
  async getTodayInsights(): Promise<IWellnessInsightResponse> {
    const res = await apiClient.get('/wellness/today');
    return res.data.data;
  },

  async getWeeklyInsight(): Promise<any> {
    const res = await apiClient.get('/wellness/weekly');
    return res.data.data;
  },
};
