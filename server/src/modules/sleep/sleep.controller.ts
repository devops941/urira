import { Request, Response, NextFunction } from 'express';
import { SleepService } from './sleep.service.js';
import {
  CreateSleepSchema,
  UpdateSleepSchema,
  QuerySleepHistorySchema,
} from './sleep.validation.js';

export class SleepController {
  private service: SleepService;

  constructor() {
    this.service = new SleepService();
  }

  addSleepRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = CreateSleepSchema.parse(req.body);
      const record = await this.service.addSleepRecord(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Sleep session logged',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  getLatest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const latest = await this.service.getLatest(userId);

      res.status(200).json({
        success: true,
        data: latest,
      });
    } catch (error) {
      next(error);
    }
  };

  getWeeklySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const summary = await this.service.getWeeklySummary(userId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  getRangeSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
      const summary = await this.service.getRangeSummary(userId, startDate, endDate);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = QuerySleepHistorySchema.parse(req.query);
      const history = await this.service.getHistory(userId, validated);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  updateSleepRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const validated = UpdateSleepSchema.parse(req.body);
      const updated = await this.service.updateSleepRecord(id, userId, validated);

      res.status(200).json({
        success: true,
        message: 'Sleep session updated',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteSleepRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const deleted = await this.service.deleteSleepRecord(id, userId);

      res.status(200).json({
        success: true,
        message: deleted ? 'Sleep record removed' : 'Record not found',
      });
    } catch (error) {
      next(error);
    }
  };
}

