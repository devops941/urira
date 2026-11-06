import { apiClient } from '../api/axiosInstance';
import { IDietSuggestionsResponse } from '../../types/nutrition';

export const dietService = {
  async getPreferences(): Promise<any> {
    const res = await apiClient.get('/diet/preferences');
    return res.data.data;
  },

  async updatePreferences(data: any): Promise<any> {
    const res = await apiClient.patch('/diet/preferences', data);
    return res.data.data;
  },

  async getSuggestions(): Promise<IDietSuggestionsResponse> {
    const res = await apiClient.get('/diet/suggestions');
    return res.data.data;
  },
};

