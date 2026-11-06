import { Request, Response, NextFunction } from 'express';
import { ActivityService } from './activity.service.js';
import {
  CreateActivitySchema,
  UpdateActivitySchema,
  QueryActivityHistorySchema,
} from './activity.validation.js';

export class ActivityController {
  private service: ActivityService;

  constructor() {
    this.service = new ActivityService();
  }

  addActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = CreateActivitySchema.parse(req.body);
      const result = await this.service.addActivity(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Activity recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getTodaySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const summary = await this.service.getTodaySummary(userId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  getWeeklyTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const weekly = await this.service.getWeeklyTrends(userId);

      res.status(200).json({
        success: true,
        data: weekly,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = QueryActivityHistorySchema.parse(req.query);
      const history = await this.service.getHistory(userId, validated);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  updateActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const validated = UpdateActivitySchema.parse(req.body);
      const updated = await this.service.updateActivity(id, userId, validated);

      res.status(200).json({
        success: true,
        message: 'Activity updated',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const deleted = await this.service.deleteActivity(id, userId);

      res.status(200).json({
        success: true,
        message: deleted ? 'Activity removed' : 'Activity not found',
      });
    } catch (error) {
      next(error);
    }
  };
}

