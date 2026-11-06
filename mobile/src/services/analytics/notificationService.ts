import { apiClient } from '../api/axiosInstance';
import { ApiResponse } from '../../types/api';
import { NotificationDto } from '../../types/analytics';

export const notificationClientService = {
  async getNotifications(): Promise<{ notifications: NotificationDto[]; unreadCount: number }> {
    const res = await apiClient.get<ApiResponse<{ notifications: NotificationDto[]; unreadCount: number }>>(
      '/notifications'
    );
    return res.data.data!;
  },

  async markAsRead(id: string): Promise<boolean> {
    const res = await apiClient.patch<ApiResponse<{ success: boolean }>>(`/notifications/${id}/read`);
    return res.data.data?.success ?? true;
  },

  async markAllAsRead(): Promise<number> {
    const res = await apiClient.patch<ApiResponse<{ count: number }>>('/notifications/read-all');
    return res.data.data?.count ?? 0;
  },

  async deleteNotification(id: string): Promise<boolean> {
    const res = await apiClient.delete<ApiResponse<{ success: boolean }>>(`/notifications/${id}`);
    return res.data.data?.success ?? true;
  },
};

