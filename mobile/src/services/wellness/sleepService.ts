import { apiClient } from '../api/axiosInstance';
import {
  ISleepLatestResponse,
  ISleepRecord,
  SleepQuality,
} from '../../types/wellness';

export const sleepService = {
  async logSleep(data: {
    bedtime: string;
    wakeTime: string;
    durationMinutes?: number;
    sleepQuality?: SleepQuality;
    quality?: SleepQuality;
    notes?: string;
  }): Promise<ISleepRecord> {
    const payload = {
      bedtime: data.bedtime,
      wakeTime: data.wakeTime,
      durationMinutes: data.durationMinutes,
      sleepQuality: data.sleepQuality || data.quality || SleepQuality.GOOD,
      notes: data.notes,
    };
    const res = await apiClient.post('/sleep', payload);
    return res.data.data;
  },

  async getLatest(): Promise<ISleepRecord | null> {
    const res = await apiClient.get('/sleep/latest');
    return res.data.data?.latest || null;
  },

  async getWeeklySummary(): Promise<any> {
    const res = await apiClient.get('/sleep/summary');
    return res.data.data;
  },

  async getWeeklyHistory(): Promise<ISleepRecord[]> {
    return this.getHistory();
  },

  async getHistory(params?: { startDate?: string; endDate?: string }): Promise<ISleepRecord[]> {
    const res = await apiClient.get('/sleep/history', { params });
    return res.data.data?.records || [];
  },

  async deleteSleep(id: string): Promise<any> {
    const res = await apiClient.delete(`/sleep/${id}`);
    return res.data.data;
  },
};
