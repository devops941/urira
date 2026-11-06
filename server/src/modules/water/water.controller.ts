import { Request, Response, NextFunction } from 'express';
import { WaterService } from './water.service.js';
import {
  CreateWaterLogSchema,
  UpdateWaterGoalSchema,
  QueryWaterHistorySchema,
} from './water.validation.js';

export class WaterController {
  private service: WaterService;

  constructor() {
    this.service = new WaterService();
  }

  addWater = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = CreateWaterLogSchema.parse(req.body);
      const result = await this.service.addWater(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Water intake recorded',
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

  getWeeklySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const weekly = await this.service.getWeeklySummary(userId);

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
      const validated = QueryWaterHistorySchema.parse(req.query);
      const history = await this.service.getHistory(userId, validated);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  getGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const goal = await this.service.getWaterGoal(userId);

      res.status(200).json({
        success: true,
        data: goal,
      });
    } catch (error) {
      next(error);
    }
  };

  updateGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = UpdateWaterGoalSchema.parse(req.body);
      const updated = await this.service.updateWaterGoal(userId, validated);

      res.status(200).json({
        success: true,
        message: 'Water goal updated',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteWaterLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const result = await this.service.deleteWaterLog(id, userId);

      res.status(200).json({
        success: true,
        message: 'Water log removed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

