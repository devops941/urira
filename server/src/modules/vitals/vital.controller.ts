import { Request, Response, NextFunction } from 'express';
import { VitalService } from './vital.service.js';
import {
  CreateVitalSchema,
  QueryVitalHistorySchema,
} from './vital.validation.js';

export class VitalController {
  private service: VitalService;

  constructor() {
    this.service = new VitalService();
  }

  addVitalRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = CreateVitalSchema.parse(req.body);
      const record = await this.service.addVitalRecord(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Vital sign reading saved',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  getLatestSnapshot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const snapshot = await this.service.getLatestSnapshot(userId);

      res.status(200).json({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = QueryVitalHistorySchema.parse(req.query);
      const history = await this.service.getHistory(userId, validated);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const deleted = await this.service.deleteRecord(id, userId);

      res.status(200).json({
        success: true,
        message: deleted ? 'Vital reading deleted' : 'Record not found',
      });
    } catch (error) {
      next(error);
    }
  };
}

