import { Request, Response, NextFunction } from 'express';
import { NutritionService } from './nutrition.service.js';

export class NutritionController {
  private nutritionService: NutritionService;

  constructor() {
    this.nutritionService = new NutritionService();
  }

  getTodaySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const summary = await this.nutritionService.getTodaySummary(userId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  getDailySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const summary = await this.nutritionService.getDailySummary(userId, date);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  getWeeklySummaries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const weekly = await this.nutritionService.getWeeklySummaries(userId);

      res.status(200).json({
        success: true,
        data: weekly,
      });
    } catch (error) {
      next(error);
    }
  };

  getTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const trends = await this.nutritionService.getTrends(userId);

      res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  };
}
