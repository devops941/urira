import { apiClient } from '../api/axiosInstance';
import { ApiResponse } from '../../types/api';
import { BmiResultDto, PreferredUnit } from '../../types/health';

export interface CalculateBmiPayload {
  heightCm?: number;
  weightKg?: number;
  heightFeet?: number;
  heightInches?: number;
  weightLbs?: number;
  unitSystem?: PreferredUnit;
  userAge?: number;
  notes?: string;
}

export const bmiApiService = {
  async calculateBmi(payload: CalculateBmiPayload): Promise<BmiResultDto> {
    const res = await apiClient.post<ApiResponse<BmiResultDto>>('/health/bmi/calculate', payload);
    return res.data.data!;
  },

  async getHistory(limit: number = 50): Promise<BmiResultDto[]> {
    const res = await apiClient.get<ApiResponse<BmiResultDto[]>>(`/health/bmi/history?limit=${limit}`);
    return res.data.data || [];
  },

  async getById(id: string): Promise<BmiResultDto> {
    const res = await apiClient.get<ApiResponse<BmiResultDto>>(`/health/bmi/${id}`);
    return res.data.data!;
  },

  async getLatest(): Promise<BmiResultDto | null> {
    try {
      const res = await apiClient.get<ApiResponse<BmiResultDto>>('/health/bmi/latest');
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  async deleteById(id: string): Promise<void> {
    await apiClient.delete(`/health/bmi/${id}`);
  },
};

export const bmiService = bmiApiService;


