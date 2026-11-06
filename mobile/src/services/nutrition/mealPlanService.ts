import { apiClient } from '../api/axiosInstance';
import { IMealPlan, MealType } from '../../types/nutrition';

export const mealPlanService = {
  async generateMealPlan(options: {
    duration?: 'DAILY' | 'WEEKLY';
    title?: string;
  }): Promise<IMealPlan> {
    try {
      const res = await apiClient.post('/meal-plans/generate', options);
      return res.data.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallbackRes = await apiClient.post('/meal-plan/generate', options);
        return fallbackRes.data.data;
      }
      throw err;
    }
  },

  async getMealPlans(): Promise<IMealPlan[]> {
    try {
      const res = await apiClient.get('/meal-plans');
      return res.data.data || [];
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallbackRes = await apiClient.get('/meal-plan');
        return fallbackRes.data.data || [];
      }
      throw err;
    }
  },

  async getMealPlanById(id: string): Promise<IMealPlan> {
    const res = await apiClient.get(`/meal-plans/${id}`);
    return res.data.data;
  },

  async approveMealPlan(id: string): Promise<IMealPlan> {
    const res = await apiClient.post(`/meal-plans/${id}/approve`);
    return res.data.data;
  },

  async swapFood(
    id: string,
    params: {
      dayIndex: number;
      mealType: MealType;
      oldFoodId: string;
      newFoodId: string;
    }
  ): Promise<IMealPlan> {
    const res = await apiClient.post(`/meal-plans/${id}/swap-food`, params);
    return res.data.data;
  },

  async logMeal(
    id: string,
    params: {
      dayIndex: number;
      mealType: MealType;
    }
  ): Promise<any> {
    const res = await apiClient.post(`/meal-plans/${id}/log-meal`, params);
    return res.data.data;
  },

  async calculateSubstitutionDelta(
    id: string,
    params: {
      dayIndex: number;
      mealType: MealType;
      oldFoodId: string;
      newFoodId: string;
    }
  ): Promise<any> {
    const res = await apiClient.post(`/meal-plans/${id}/substitute-delta`, params);
    return res.data.data;
  },

  async rateMeal(
    id: string,
    params: {
      dayIndex: number;
      mealType: MealType;
      rating: 'LOVED_IT' | 'GOOD' | 'AVERAGE' | 'NOT_PREFERRED';
      comment?: string;
    }
  ): Promise<IMealPlan> {
    const res = await apiClient.post(`/meal-plans/${id}/feedback`, params);
    return res.data.data;
  },

  async saveAsTemplate(id: string, templateName: string): Promise<IMealPlan> {
    const res = await apiClient.post(`/meal-plans/${id}/save-template`, { templateName });
    return res.data.data;
  },

  async getTemplates(): Promise<IMealPlan[]> {
    const res = await apiClient.get('/meal-plans/templates/list');
    return res.data.data;
  },

  async applyTemplate(id: string): Promise<IMealPlan> {
    const res = await apiClient.post(`/meal-plans/${id}/apply-template`);
    return res.data.data;
  },

  async deleteMealPlan(id: string): Promise<boolean> {
    const res = await apiClient.delete(`/meal-plans/${id}`);
    return res.data.success;
  },
};

