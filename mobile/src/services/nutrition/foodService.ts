import { apiClient } from '../api/axiosInstance';
import { IFood, FoodCategory } from '../../types/nutrition';

export const foodService = {
  async getCategories(): Promise<{ category: string; count: number }[]> {
    const res = await apiClient.get('/foods/categories');
    return res.data.data;
  },

  async searchFoods(params: {
    q?: string;
    category?: FoodCategory;
    dietaryTag?: string;
    page?: number;
    limit?: number;
  }): Promise<{ foods: IFood[]; total: number }> {
    const res = await apiClient.get('/foods/search', { params });
    return {
      foods: res.data.data,
      total: res.data.pagination?.total || res.data.data.length,
    };
  },

  async getFoodById(id: string): Promise<IFood> {
    const res = await apiClient.get(`/foods/${id}`);
    return res.data.data;
  },

  async getFavorites(): Promise<IFood[]> {
    const res = await apiClient.get('/foods/favorites');
    return res.data.data;
  },

  async toggleFavorite(foodId: string): Promise<{ isFavorited: boolean }> {
    const res = await apiClient.post(`/foods/${foodId}/favorite`);
    return res.data.data;
  },
};

