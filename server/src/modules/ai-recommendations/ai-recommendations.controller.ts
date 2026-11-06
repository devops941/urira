import { Request, Response } from 'express';
import { aiRecommendationsService, AiRecommendationsService } from './ai-recommendations.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class AiRecommendationsController {
  constructor(private service: AiRecommendationsService = aiRecommendationsService) {}

  suggestGoals = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }
      const data = await this.service.suggestGoals(userId);
      sendSuccess(res, 'Personalized health goals suggested successfully', data);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to suggest health goals', 500);
    }
  };

  explainBmi = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }
      const { bmiId } = req.body || {};
      const data = await this.service.explainBmi(userId, bmiId);
      sendSuccess(res, 'BMI explanation generated successfully', data);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to generate BMI explanation', 500);
    }
  };

  explainCalories = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }
      const { calorieId } = req.body || {};
      const data = await this.service.explainCalories(userId, calorieId);
      sendSuccess(res, 'Calorie explanation generated successfully', data);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to generate calorie explanation', 500);
    }
  };

  generateHealthSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }
      const data = await this.service.generateHealthSummary(userId);
      sendSuccess(res, 'Daily AI health summary generated successfully', data);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to generate daily health summary', 500);
    }
  };

  getRecommendationsHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const history = await this.service.getRecommendationsHistory(userId, limit);
      sendSuccess(res, 'AI recommendations history retrieved', history);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to retrieve AI recommendations history', 500);
    }
  };
}

export const aiRecommendationsController = new AiRecommendationsController();

