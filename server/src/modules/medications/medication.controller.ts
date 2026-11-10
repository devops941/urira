import { Request, Response, NextFunction } from 'express';
import { MedicationService } from './medication.service.js';
import {
  CreateMedicationSchema,
  UpdateMedicationSchema,
  RecordDoseSchema,
} from './medication.validation.js';

export class MedicationController {
  private service: MedicationService;

  constructor() {
    this.service = new MedicationService();
  }

  addMedication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = CreateMedicationSchema.parse(req.body);
      const med = await this.service.addMedication(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Medication schedule created',
        data: med,
      });
    } catch (error) {
      next(error);
    }
  };

  getActiveMedications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const meds = await this.service.getActiveMedications(userId);

      res.status(200).json({
        success: true,
        data: meds,
      });
    } catch (error) {
      next(error);
    }
  };

  getTodaySchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const schedule = await this.service.getTodaySchedule(userId);

      res.status(200).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  };

  getMedicationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const med = await this.service.getMedicationById(id, userId);

      if (!med) {
        res.status(404).json({
          success: false,
          message: 'Medication schedule not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: med,
      });
    } catch (error) {
      next(error);
    }
  };

  updateMedication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const validated = UpdateMedicationSchema.parse(req.body);
      const updated = await this.service.updateMedication(id, userId, validated);

      res.status(200).json({
        success: true,
        message: 'Medication updated',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMedication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const deleted = await this.service.deleteMedication(id, userId);

      res.status(200).json({
        success: true,
        message: deleted ? 'Medication removed' : 'Medication not found',
      });
    } catch (error) {
      next(error);
    }
  };

  recordDose = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { id } = req.params;
      const validated = RecordDoseSchema.parse(req.body);
      const event = await this.service.recordDose(id, userId, validated);

      res.status(200).json({
        success: true,
        message: `Dose marked as ${validated.status.toLowerCase()}`,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  };

  getAdherenceSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const summary = await this.service.getAdherenceSummary(userId);

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
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Both startDate and endDate (YYYY-MM-DD) are required',
        });
        return;
      }

      const summary = await this.service.getRangeSummary(
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

