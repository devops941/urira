import { apiClient } from '../api/axiosInstance';
import { ApiResponse } from '../../types/api';
import { HealthDashboardDto, TrendDataPoint, Timeframe } from '../../types/analytics';

export const analyticsService = {
  async getDashboard(timeframe: Timeframe = 'weekly'): Promise<HealthDashboardDto> {
    const res = await apiClient.get<ApiResponse<HealthDashboardDto>>('/reports/dashboard', {
      params: { timeframe },
    });
    return res.data.data!;
  },

  async getTrends(
    metric: 'steps' | 'water' | 'sleep' | 'vitals' | 'calories',
    days: number = 14
  ): Promise<TrendDataPoint[]> {
    const res = await apiClient.get<ApiResponse<TrendDataPoint[]>>('/reports/trends', {
      params: { metric, days },
    });
    return res.data.data!;
  },

  async getCsvExportText(): Promise<string> {
    const res = await apiClient.get<string>('/reports/export/csv', {
      responseType: 'text',
    });
    return res.data;
  },

  async getPrintableReportHtml(): Promise<string> {
    const res = await apiClient.get<string>('/reports/export/printable', {
      responseType: 'text',
    });
    return res.data;
  },
};

