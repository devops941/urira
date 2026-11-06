import { apiClient } from '../api/axiosInstance';
import { DailyVitalityScore } from '../../types/vitality';

export const vitalityService = {
  async getDailyVitality(): Promise<DailyVitalityScore> {
    const res = await apiClient.get('/wellness/vitality');
    return res.data.data;
  },
};

