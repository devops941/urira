import { apiClient } from '../api/axiosInstance';
import { ApiResponse } from '../../types/api';

export interface WalkingSessionDto {
  _id?: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  steps: number;
  distanceMeters: number;
  durationSeconds: number;
  caloriesBurned: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  source: 'ANDROID_STEP_COUNTER' | 'HEALTH_CONNECT' | 'CORE_MOTION' | 'DEVICE';
  notes?: string;
  dateString: string;
  createdAt?: string;
}

export const walkingApiService = {
  /**
   * Start a new walking session on server
   */
  async startSession(data: {
    sessionId: string;
    source?: string;
    startTime?: string;
    notes?: string;
  }): Promise<WalkingSessionDto> {
    const res = await apiClient.post<ApiResponse<WalkingSessionDto>>('/walking/start', data);
    return res.data.data!;
  },

  /**
   * Pause walking session
   */
  async pauseSession(
    sessionId: string,
    data: {
      steps?: number;
      distanceMeters?: number;
      durationSeconds?: number;
      caloriesBurned?: number;
      notes?: string;
    }
  ): Promise<WalkingSessionDto> {
    const res = await apiClient.post<ApiResponse<WalkingSessionDto>>(
      `/walking/${sessionId}/pause`,
      data
    );
    return res.data.data!;
  },

  /**
   * Resume paused walking session
   */
  async resumeSession(sessionId: string): Promise<WalkingSessionDto> {
    const res = await apiClient.post<ApiResponse<WalkingSessionDto>>(
      `/walking/${sessionId}/resume`
    );
    return res.data.data!;
  },

  /**
   * Complete session and sync to Activity Record & Dashboard
   */
  async completeSession(
    sessionId: string,
    data: {
      steps: number;
      distanceMeters: number;
      durationSeconds: number;
      caloriesBurned: number;
      endTime?: string;
      notes?: string;
    }
  ): Promise<{ session: WalkingSessionDto; todaySummary: any }> {
    const res = await apiClient.post<ApiResponse<{ session: WalkingSessionDto; todaySummary: any }>>(
      `/walking/${sessionId}/complete`,
      data
    );
    return res.data.data!;
  },

  /**
   * Retrieve active session if app reopened during a walk
   */
  async getActiveSession(): Promise<WalkingSessionDto | null> {
    try {
      const res = await apiClient.get<ApiResponse<WalkingSessionDto | null>>('/walking/active');
      return res.data.data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Get past walking workouts
   */
  async getHistory(page: number = 1, limit: number = 20): Promise<{ sessions: WalkingSessionDto[]; total: number }> {
    const res = await apiClient.get<ApiResponse<{ sessions: WalkingSessionDto[]; total: number }>>('/walking/history', {
      params: { page, limit },
    });
    return res.data.data!;
  },

  /**
   * Get today's combined walking workout summary
   */
  async getDailySummary(date?: string): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>('/walking/summary/daily', {
      params: { date },
    });
    return res.data.data!;
  },
};
