import { Platform } from 'react-native';
import { apiClient } from '../api/axiosInstance';
import { ApiResponse } from '../../types/api';
import { HealthProfileDto } from '../../types/health';

export const healthProfileApiService = {
  async getProfile(): Promise<HealthProfileDto> {
    const res = await apiClient.get<ApiResponse<HealthProfileDto>>('/health-profile');
    return res.data.data!;
  },

  async updateProfile(payload: Partial<HealthProfileDto>): Promise<HealthProfileDto> {
    const res = await apiClient.patch<ApiResponse<HealthProfileDto>>('/health-profile', payload);
    return res.data.data!;
  },

  async uploadAvatar(imageUri: string): Promise<HealthProfileDto> {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('avatar', blob, filename);
    } else {
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
    }

    const headers: Record<string, string> = {};
    if (Platform.OS !== 'web') {
      headers['Content-Type'] = 'multipart/form-data';
    }

    const res = await apiClient.post<ApiResponse<HealthProfileDto>>(
      '/health-profile/avatar',
      formData,
      { headers }
    );
    return res.data.data!;
  },

  async completeOnboarding(payload: Partial<HealthProfileDto>): Promise<HealthProfileDto> {
    const res = await apiClient.post<ApiResponse<HealthProfileDto>>(
      '/health-profile/onboarding/complete',
      payload
    );
    return res.data.data!;
  },

  async skipOnboarding(): Promise<HealthProfileDto> {
    const res = await apiClient.post<ApiResponse<HealthProfileDto>>(
      '/health-profile/onboarding/skip'
    );
    return res.data.data!;
  },
};

export const profileService = healthProfileApiService;


