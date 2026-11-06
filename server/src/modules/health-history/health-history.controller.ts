import { Request, Response } from 'express';
import { healthHistoryService } from './health-history.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class HealthHistoryController {
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const category = (req.query.category as string) || 'ALL';
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const history = await healthHistoryService.getUnifiedHistory(userId, category, limit);
      sendSuccess(res, 'Unified health history retrieved', history);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve health history', 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const item = await healthHistoryService.getHistoryDetail(req.params.id, userId);
      if (!item) {
        sendError(res, 'History item not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'History record details retrieved', item);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve history details', 500);
    }
  }

  async deleteById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const success = await healthHistoryService.deleteHistoryItem(req.params.id, userId);
      if (!success) {
        sendError(res, 'History item not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'Health history record deleted', { id: req.params.id });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete history record', 500);
    }
  }
}

export const healthHistoryController = new HealthHistoryController();

