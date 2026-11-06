import { apiClient } from '../api/axiosInstance';
import { ApiResponse } from '../../types/api';
import { HealthGoalDto, GoalCategory, GoalStatus } from '../../types/health';

export interface CreateGoalPayload {
  title: string;
  category: GoalCategory;
  targetValue: number;
  initialValue?: number;
  currentValue?: number;
  unit: string;
  startDate?: string;
  targetDate: string;
  notes?: string;
}

export interface UpdateGoalPayload {
  title?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: string;
  status?: GoalStatus;
  notes?: string;
}

export const goalsApiService = {
  async getGoals(status?: GoalStatus): Promise<HealthGoalDto[]> {
    const url = status ? `/health/goals?status=${status}` : '/health/goals';
    const res = await apiClient.get<ApiResponse<HealthGoalDto[]>>(url);
    return res.data.data || [];
  },

  async getById(id: string): Promise<HealthGoalDto> {
    const res = await apiClient.get<ApiResponse<HealthGoalDto>>(`/health/goals/${id}`);
    return res.data.data!;
  },

  async createGoal(payload: CreateGoalPayload): Promise<HealthGoalDto> {
    const res = await apiClient.post<ApiResponse<HealthGoalDto>>('/health/goals', payload);
    return res.data.data!;
  },

  async updateGoal(id: string, payload: UpdateGoalPayload): Promise<HealthGoalDto> {
    const res = await apiClient.patch<ApiResponse<HealthGoalDto>>(`/health/goals/${id}`, payload);
    return res.data.data!;
  },

  async updateProgress(id: string, currentValue: number): Promise<HealthGoalDto> {
    const res = await apiClient.patch<ApiResponse<HealthGoalDto>>(`/health/goals/${id}/progress`, {
      currentValue,
    });
    return res.data.data!;
  },

  async pauseGoal(id: string): Promise<HealthGoalDto> {
    const res = await apiClient.patch<ApiResponse<HealthGoalDto>>(`/health/goals/${id}/pause`);
    return res.data.data!;
  },

  async resumeGoal(id: string): Promise<HealthGoalDto> {
    const res = await apiClient.patch<ApiResponse<HealthGoalDto>>(`/health/goals/${id}/resume`);
    return res.data.data!;
  },

  async deleteGoal(id: string): Promise<void> {
    await apiClient.delete(`/health/goals/${id}`);
  },

  async getGoalById(id: string): Promise<HealthGoalDto> {
    return this.getById(id);
  },
};

export const goalsService = goalsApiService;


