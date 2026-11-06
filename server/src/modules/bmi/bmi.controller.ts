import { Request, Response } from 'express';
import { bmiService } from './bmi.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class BMIController {
  async calculate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const result = await bmiService.calculateAndSave(userId, req.body);
      sendSuccess(res, 'BMI calculated and recorded successfully', result, 201);
    } catch (error: any) {
      sendError(res, error.message || 'BMI calculation failed', 400);
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
      const history = await bmiService.getHistory(userId, limit);
      sendSuccess(res, 'BMI history retrieved', history);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve BMI history', 500);
    }
  }

  async getLatest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const latest = await bmiService.getLatest(userId);
      sendSuccess(res, 'Latest BMI retrieved', latest);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve latest BMI', 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const record = await bmiService.getById(req.params.id, userId);
      if (!record) {
        sendError(res, 'BMI record not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'BMI record retrieved', record);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve BMI record', 500);
    }
  }

  async deleteById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const success = await bmiService.deleteById(req.params.id, userId);
      if (!success) {
        sendError(res, 'BMI record not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'BMI record deleted successfully', { id: req.params.id });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete BMI record', 500);
    }
  }
}

export const bmiController = new BMIController();

