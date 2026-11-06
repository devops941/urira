import { Request, Response } from 'express';
import { calorieService } from './calories.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class CalorieController {
  async estimate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const result = await calorieService.estimateAndSave(userId, req.body);
      sendSuccess(res, 'Calorie target estimated and recorded successfully', result, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Calorie estimation failed', 400);
    }
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const history = await calorieService.getHistory(userId, limit);
      sendSuccess(res, 'Calorie history retrieved', history);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve calorie history', 500);
    }
  }

  async getLatest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const latest = await calorieService.getLatest(userId);
      sendSuccess(res, 'Latest calorie target retrieved', latest);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve latest calories', 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const record = await calorieService.getById(req.params.id, userId);
      if (!record) {
        sendError(res, 'Calorie record not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'Calorie record retrieved', record);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve calorie record', 500);
    }
  }

  async deleteById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const success = await calorieService.deleteById(req.params.id, userId);
      if (!success) {
        sendError(res, 'Calorie record not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'Calorie record deleted successfully', { id: req.params.id });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete calorie record', 500);
    }
  }
}

export const calorieController = new CalorieController();

