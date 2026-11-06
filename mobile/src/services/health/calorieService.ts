import { apiClient } from '../api/axiosInstance';
import { ApiResponse } from '../../types/api';
import {
  CalorieResultDto,
  ActivityLevel,
  CalorieGoalType,
  BiologicalSex,
} from '../../types/health';

export interface EstimateCaloriesPayload {
  age?: number;
  biologicalSex?: BiologicalSex;
  heightCm?: number;
  weightKg?: number;
  activityLevel: ActivityLevel;
  goal: CalorieGoalType;
  saveRecord?: boolean;
  notes?: string;
}

export const calorieApiService = {
  async estimateCalories(payload: EstimateCaloriesPayload): Promise<CalorieResultDto> {
    const res = await apiClient.post<ApiResponse<CalorieResultDto>>(
      '/health/calories/estimate',
      payload
    );
    return res.data.data!;
  },

  async getHistory(limit: number = 50): Promise<CalorieResultDto[]> {
    const res = await apiClient.get<ApiResponse<CalorieResultDto[]>>(
      `/health/calories/history?limit=${limit}`
    );
    return res.data.data || [];
  },

  async getById(id: string): Promise<CalorieResultDto> {
    const res = await apiClient.get<ApiResponse<CalorieResultDto>>(`/health/calories/${id}`);
    return res.data.data!;
  },

  async getLatest(): Promise<CalorieResultDto | null> {
    try {
      const res = await apiClient.get<ApiResponse<CalorieResultDto>>('/health/calories/latest');
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  async deleteById(id: string): Promise<void> {
    await apiClient.delete(`/health/calories/${id}`);
  },
};

export const calorieService = calorieApiService;


