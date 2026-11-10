import { Request, Response, NextFunction } from 'express';
import { FoodLogService } from './food-log.service.js';
import {
  CreateFoodLogSchema,
  UpdateFoodLogSchema,
  QueryFoodLogHistorySchema,
} from './food-log.validation.js';

export class FoodLogController {
  private foodLogService: FoodLogService;

  constructor() {
    this.foodLogService = new FoodLogService();
  }

  addFoodLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = CreateFoodLogSchema.parse(req.body);
      const result = await this.foodLogService.addFoodLog(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Food logged successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getTodayLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const result = await this.foodLogService.getTodayLogs(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = QueryFoodLogHistorySchema.parse(req.query);
      const result = await this.foodLogService.getHistory(userId, validated);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getLogById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const log = await this.foodLogService.getLogById(id, userId);

      if (!log) {
        res.status(404).json({
          success: false,
          message: 'Food log not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  };

  updateFoodLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const validated = UpdateFoodLogSchema.parse(req.body);
      const result = await this.foodLogService.updateFoodLog(id, userId, validated);

      res.status(200).json({
        success: true,
        message: 'Food log updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteFoodLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const result = await this.foodLogService.deleteFoodLog(id, userId);

      res.status(200).json({
        success: true,
        message: 'Food log removed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getRangeSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Both startDate and endDate (YYYY-MM-DD) are required',
        });
        return;
      }

      const summary = await this.foodLogService.getRangeSummary(
        userId,
        String(startDate),
        String(endDate)
      );

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };
}
