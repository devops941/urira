import { Request, Response, NextFunction } from 'express';
import { DietPreferenceService } from './diet-preference.service.js';
import { z } from 'zod';
import { DietaryType } from './diet-preference.model.js';

const UpdatePreferencesSchema = z.object({
  dietaryType: z.nativeEnum(DietaryType).optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  foodAllergies: z.array(z.string()).optional(),
  excludedFoods: z.array(z.string()).optional(),
  dislikedFoods: z.array(z.string()).optional(),
  mealsPerDay: z.number().min(2).max(6).optional(),
});

export class DietPreferenceController {
  private service: DietPreferenceService;

  constructor() {
    this.service = new DietPreferenceService();
  }

  getPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const prefs = await this.service.getPreferences(userId);

      res.status(200).json({
        success: true,
        data: prefs,
      });
    } catch (error) {
      next(error);
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const validated = UpdatePreferencesSchema.parse(req.body);
      const updated = await this.service.updatePreferences(userId, validated);

      res.status(200).json({
        success: true,
        message: 'Dietary preferences updated',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };
}
