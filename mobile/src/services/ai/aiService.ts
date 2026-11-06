import { apiClient } from '../api/axiosInstance';
import { ApiResponse } from '../../types/api';
import {
  AiGoalSuggestionsResponse,
  AiBmiExplanationResponse,
  AiCalorieExplanationResponse,
  AiHealthSummaryResponse,
} from '../../types/ai';

export const aiApiService = {
  /**
   * Request personalized, structured health goal suggestions
   */
  async suggestGoals(): Promise<AiGoalSuggestionsResponse> {
    const res = await apiClient.post<ApiResponse<AiGoalSuggestionsResponse>>(
      '/ai/health-goals/suggest'
    );
    return res.data.data!;
  },

  /**
   * Request plain-language AI explanation of BMI
   */
  async explainBmi(bmiId?: string): Promise<AiBmiExplanationResponse> {
    const res = await apiClient.post<ApiResponse<AiBmiExplanationResponse>>('/ai/explain-bmi', {
      bmiId,
    });
    return res.data.data!;
  },

  /**
   * Request plain-language AI explanation of Calorie estimate
   */
  async explainCalories(calorieId?: string): Promise<AiCalorieExplanationResponse> {
    const res = await apiClient.post<ApiResponse<AiCalorieExplanationResponse>>(
      '/ai/explain-calories',
      { calorieId }
    );
    return res.data.data!;
  },

  /**
   * Request daily health summary and insight for Dashboard
   */
  async getHealthSummary(): Promise<AiHealthSummaryResponse> {
    const res = await apiClient.post<ApiResponse<AiHealthSummaryResponse>>('/ai/health-summary');
    return res.data.data!;
  },
};

export const aiService = aiApiService;

