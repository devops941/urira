import { Request, Response, NextFunction } from 'express';
import { WellnessInsightService } from './wellness-insight.service.js';
import { vitalityService } from './vitality.service.js';

export class WellnessInsightController {
  private service: WellnessInsightService;

  constructor() {
    this.service = new WellnessInsightService();
  }

  generateInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const insights = await this.service.generateInsights(userId);

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      next(error);
    }
  };

  getDailyVitality = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const vitality = await vitalityService.calculateDailyVitality(userId);

      res.status(200).json({
        success: true,
        data: vitality,
      });
    } catch (error) {
      next(error);
    }
  };
}

