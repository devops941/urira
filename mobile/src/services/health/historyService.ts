import { apiClient } from '../api/axiosInstance';
import { ApiResponse } from '../../types/api';
import { UnifiedHistoryItemDto } from '../../types/health';

export const historyApiService = {
  async getHistory(category: string = 'ALL', limit: number = 50): Promise<UnifiedHistoryItemDto[]> {
    const res = await apiClient.get<ApiResponse<UnifiedHistoryItemDto[]>>(
      `/health/history?category=${category}&limit=${limit}`
    );
    return res.data.data || [];
  },

  async getUnifiedHistory(category: string = 'ALL', limit: number = 50): Promise<UnifiedHistoryItemDto[]> {
    return this.getHistory(category, limit);
  },

  async getById(id: string): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>(`/health/history/${id}`);
    return res.data.data;
  },

  async getHistoryDetail(id: string): Promise<any> {
    return this.getById(id);
  },

  async deleteById(id: string): Promise<void> {
    await apiClient.delete(`/health/history/${id}`);
  },

  async deleteHistoryItem(id: string): Promise<void> {
    return this.deleteById(id);
  },
};

export const historyService = historyApiService;


